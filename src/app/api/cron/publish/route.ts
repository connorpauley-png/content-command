import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { publishToPlatform } from '@/lib/publishers'
import { enhancePhotosForPost } from '@/lib/enhance'

// POST /api/cron/publish — process publish queue
// Replaces /api/cron/autopublish but also works with cc_publish_queue table
export async function POST(request: NextRequest) {
  // Optional auth check
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()
  let useQueue = false

  // Try publish_queue table first
  try {
    const { data: queueItems } = await supabaseAdmin
      .from('cc_publish_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .order('scheduled_at')
      .limit(20)

    if (queueItems && queueItems.length > 0) {
      useQueue = true
      return await processQueue(queueItems, now)
    }
  } catch {
    // Table doesn't exist yet, fall through to legacy approach
  }

  if (!useQueue) {
    // Legacy: process approved posts directly (same as old autopublish)
    return await processLegacy(now)
  }

  return NextResponse.json({ message: 'No posts due for publishing', processed: 0 })
}

// New queue-based processing
async function processQueue(items: QueueItem[], now: string) {
  // Also get failed items ready for retry
  let retries: QueueItem[] = []
  try {
    const { data } = await supabaseAdmin
      .from('cc_publish_queue')
      .select('*')
      .eq('status', 'failed')
      .lt('attempts', 3)
      .lte('next_retry_at', now)
      .order('next_retry_at')
      .limit(10)
    retries = data || []
  } catch { /* ignore */ }

  const allItems = [...items, ...retries]
  const results = []

  for (const item of allItems) {
    await supabaseAdmin
      .from('cc_publish_queue')
      .update({ status: 'processing', last_attempt_at: now })
      .eq('id', item.id)

    try {
      const result = await publishToPlatform(item.platform, item.content, item.photo_urls || [])

      if (result.success) {
        await supabaseAdmin
          .from('cc_publish_queue')
          .update({
            status: 'completed',
            external_post_id: result.postId,
            completed_at: now,
          })
          .eq('id', item.id)
        results.push({ queue_id: item.id, post_id: item.post_id, platform: item.platform, status: 'completed' })
      } else {
        const attempts = (item.attempts || 0) + 1
        const retryDelay = Math.pow(2, attempts) * 60 * 1000
        await supabaseAdmin
          .from('cc_publish_queue')
          .update({
            status: 'failed',
            attempts,
            error_message: result.error,
            next_retry_at: new Date(Date.now() + retryDelay).toISOString(),
          })
          .eq('id', item.id)
        results.push({ queue_id: item.id, post_id: item.post_id, platform: item.platform, status: 'failed', error: result.error })
      }
    } catch (error) {
      await supabaseAdmin
        .from('cc_publish_queue')
        .update({
          status: 'failed',
          attempts: (item.attempts || 0) + 1,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          next_retry_at: new Date(Date.now() + 120000).toISOString(),
        })
        .eq('id', item.id)
    }

    // Update parent post status
    await updatePostStatusFromQueue(item.post_id)
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter(r => r.status === 'completed').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
  })
}

// Legacy processing (same logic as old autopublish)
async function processLegacy(now: string) {
  const { data: posts, error } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('status', 'approved')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!posts || posts.length === 0) {
    return NextResponse.json({ message: 'No posts due for publishing', processed: 0 })
  }

  const results = []

  for (const post of posts) {
    let photoUrls = post.photo_urls || []
    if (photoUrls.length > 0) {
      try { photoUrls = await enhancePhotosForPost(photoUrls) } catch { /* use originals */ }
    }

    const platformResults: Record<string, { success: boolean; postId?: string; error?: string }> = {}
    const postedIds: Record<string, string> = {}
    let anySuccess = false

    for (const platform of post.platforms) {
      const result = await publishToPlatform(platform, post.content, photoUrls)
      platformResults[platform] = result
      if (result.success && result.postId) {
        postedIds[platform] = result.postId
        anySuccess = true
      }
    }

    const newStatus = anySuccess ? 'posted' : 'failed'
    await supabaseAdmin
      .from('cc_posts')
      .update({
        status: newStatus,
        posted_ids: { ...(post.posted_ids || {}), ...postedIds },
        photo_urls: photoUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)

    results.push({
      id: post.id,
      status: newStatus,
      platformResults,
    })
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter(r => r.status === 'posted').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
  })
}

async function updatePostStatusFromQueue(postId: string) {
  try {
    const { data: items } = await supabaseAdmin
      .from('cc_publish_queue')
      .select('status, attempts, max_attempts')
      .eq('post_id', postId)

    if (!items?.length) return

    const allCompleted = items.every((i: QueueItem) => i.status === 'completed')
    const anyCompleted = items.some((i: QueueItem) => i.status === 'completed')
    const allFinalFailed = items.every((i: QueueItem) =>
      i.status === 'failed' && (i.attempts || 0) >= (i.max_attempts || 3)
    )

    let postStatus: string | undefined
    if (allCompleted) postStatus = 'posted'
    else if (allFinalFailed) postStatus = 'failed'
    else if (anyCompleted) postStatus = 'partial'
    else return

    await supabaseAdmin
      .from('cc_posts')
      .update({
        status: postStatus,
        published_at: allCompleted ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
  } catch { /* ignore if queue table missing */ }
}

// Health check via GET
export async function GET() {
  const now = new Date().toISOString()
  const { data: pending } = await supabaseAdmin
    .from('cc_posts')
    .select('id, scheduled_at, platforms')
    .eq('status', 'approved')
    .lte('scheduled_at', now)

  return NextResponse.json({
    pending: pending?.length || 0,
    posts: pending || [],
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueueItem = any
