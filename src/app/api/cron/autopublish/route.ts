import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { publishToPlatform } from '@/lib/publishers'
import { enhancePhotosForPost } from '@/lib/enhance'

// Auto-publish approved posts that are past their scheduled time
// Called every 5 minutes by the internal scheduler
// Also callable manually: POST /api/cron/autopublish

export async function POST() {
  const now = new Date().toISOString()

  // Get approved posts due for publishing AND partial posts for retry
  const { data: approvedPosts, error: approvedError } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('status', 'approved')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(10)

  const { data: partialPosts, error: partialError } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('status', 'partial')
    .order('updated_at', { ascending: true })
    .limit(5)

  const posts = [...(approvedPosts || []), ...(partialPosts || [])]
  const error = approvedError || partialError

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({ message: 'No posts due for publishing', published: 0 })
  }

  const results: Array<{
    id: string
    content: string
    platforms: string[]
    status: 'posted' | 'failed'
    platformResults: Record<string, { success: boolean; error?: string }>
  }> = []

  for (const post of posts) {
    // Auto-enhance photos if needed
    let photoUrls = post.photo_urls || []
    if (photoUrls.length > 0) {
      try {
        photoUrls = await enhancePhotosForPost(photoUrls)
      } catch (err) {
        console.error(`Photo enhancement failed for ${post.id}:`, err)
      }
    }

    // Determine which platforms to publish to
    // For partial retries, only retry platforms that previously failed
    const existingPostedIds = post.posted_ids || {}
    const platformsToPublish = post.status === 'partial'
      ? post.platforms.filter((p: string) => !existingPostedIds[p])
      : post.platforms

    // Check retry count (max 3 attempts for partial)
    const retryMatch = post.notes?.match(/\[RETRY_COUNT:(\d+)\]/)
    const retryCount = retryMatch ? parseInt(retryMatch[1]) : 0
    if (post.status === 'partial' && retryCount >= 3) {
      // Max retries reached, mark as failed
      await supabaseAdmin
        .from('cc_posts')
        .update({ status: 'failed', notes: `${post.notes || ''}\n[AUTO-PUBLISH] Max retries (3) reached. Marking as failed.`, updated_at: new Date().toISOString() })
        .eq('id', post.id)
      results.push({ id: post.id, content: post.content?.slice(0, 60) + '...', platforms: post.platforms, status: 'failed' as const, platformResults: {} })
      continue
    }

    // Publish to each platform
    const platformResults: Record<string, { success: boolean; postId?: string; error?: string }> = {}
    const postedIds: Record<string, string> = {}
    let anySuccess = false
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let anyFailure = false

    for (const platform of platformsToPublish) {
      const result = await publishToPlatform(platform, post.content, photoUrls)
      platformResults[platform] = result

      if (result.success && result.postId) {
        postedIds[platform] = result.postId
        anySuccess = true
      } else {
        anyFailure = true
      }
    }

    // Include previously succeeded platforms
    const allPostedIds = { ...existingPostedIds, ...postedIds }
    const allPlatformsSucceeded = post.platforms.every((p: string) => allPostedIds[p])

    let newStatus: string
    if (allPlatformsSucceeded) {
      newStatus = 'posted'
    } else if (anySuccess || Object.keys(existingPostedIds).length > 0) {
      newStatus = 'partial'
    } else {
      newStatus = 'failed'
    }

    const failedPlatforms = Object.entries(platformResults)
      .filter(([, r]) => !r.success)
      .map(([p, r]) => `${p}: ${r.error}`)

    const newRetryCount = newStatus === 'partial' ? retryCount + 1 : retryCount
    // Strip old retry count from notes
    const cleanNotes = (post.notes || '').replace(/\[RETRY_COUNT:\d+\]/, '').trim()
    const retryTag = newStatus === 'partial' ? ` [RETRY_COUNT:${newRetryCount}]` : ''
    const updatedNotes = failedPlatforms.length > 0
      ? `${cleanNotes ? cleanNotes + '\n' : ''}[AUTO-PUBLISH ${new Date().toISOString()}] Failures: ${failedPlatforms.join('; ')}${retryTag}`
      : `${cleanNotes ? cleanNotes + '\n' : ''}[AUTO-PUBLISH ${new Date().toISOString()}] Success`

    // Update post
    await supabaseAdmin
      .from('cc_posts')
      .update({
        status: newStatus,
        posted_ids: allPostedIds,
        photo_urls: photoUrls,
        notes: updatedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)

    results.push({
      id: post.id,
      content: post.content?.slice(0, 60) + '...',
      platforms: post.platforms,
      status: newStatus as 'posted' | 'failed',
      platformResults,
    })
  }

  const succeeded = results.filter((r) => r.status === 'posted').length
  const failed = results.filter((r) => r.status === 'failed').length

  return NextResponse.json({
    message: `Auto-published ${succeeded} posts, ${failed} failed`,
    published: succeeded,
    failed,
    results,
  })
}

// Also support GET for easy health checks
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
    nextCheck: 'Every 5 minutes',
  })
}
