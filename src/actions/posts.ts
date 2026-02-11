'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { publishToPlatform } from '@/lib/publishers'
import { getContentHash, checkDuplicate } from '@/lib/dedup'
import { validatePost, hasBlockingErrors } from '@/lib/validators'
import { enhancePhotosForPost } from '@/lib/enhance'
import { revalidatePath } from 'next/cache'

// ── Types ───────────────────────────────────────────────────

export type CreatePostInput = {
  content: string
  platforms: string[]
  scheduled_at?: string | null
  status?: string
  photo_urls?: string[]
  photo_source?: string | null
  ai_generated?: boolean
  tags?: string[]
  notes?: string | null
  skip_dedup?: boolean
}

export type UpdatePostInput = Partial<CreatePostInput>

type PublishResult = {
  success: boolean
  postId?: string
  error?: string
  url?: string
}

type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

// ── Helpers ─────────────────────────────────────────────────

async function getPost(id: string) {
  const { data, error } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw new Error('Post not found')
  return data
}

async function updatePostWithVersion(
  id: string,
  updates: Record<string, unknown>,
  expectedVersion?: number
) {
  const updatePayload = {
    ...updates,
    updated_at: new Date().toISOString(),
    version: undefined as unknown,
  }

  // Build query
  let query = supabaseAdmin
    .from('cc_posts')
    .update(updatePayload)
    .eq('id', id)

  // Optimistic locking: if expectedVersion provided, require it matches
  if (expectedVersion !== undefined) {
    query = query.eq('version', expectedVersion)
  }

  const { data, error } = await query
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Post was modified by someone else. Please refresh and try again.')
    }
    throw new Error(error.message)
  }

  // Increment version
  try {
    await supabaseAdmin.rpc('increment_post_version', { post_id: id })
  } catch {
    // If the RPC doesn't exist, manually increment
    await supabaseAdmin
      .from('cc_posts')
      .update({ version: (data.version || 1) + 1 })
      .eq('id', id)
  }

  revalidatePath('/pipeline')
  revalidatePath('/')
  return data
}

// ── CRUD ────────────────────────────────────────────────────

export async function createPost(input: CreatePostInput): Promise<ActionResult> {
  try {
    const content = input.content || ''
    const platforms = input.platforms || []

    // Dedup check
    if (!input.skip_dedup && content && platforms.length > 0) {
      const dupCheck = await checkDuplicate(content, platforms)
      if (dupCheck.isDuplicate) {
        return {
          success: false,
          error: `Duplicate content detected (${dupCheck.matchType} match with post ${dupCheck.matchedPostId})`,
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('cc_posts')
      .insert({
        content,
        platforms,
        scheduled_at: input.scheduled_at || null,
        status: input.status || 'idea',
        photo_urls: input.photo_urls || [],
        photo_source: input.photo_source || null,
        ai_generated: input.ai_generated || false,
        tags: input.tags || [],
        notes: input.notes || null,
        content_hash: content ? getContentHash(content) : null,
        version: 1,
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/pipeline')
    revalidatePath('/')
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to create post' }
  }
}

export async function updatePost(
  id: string,
  input: UpdatePostInput,
  expectedVersion?: number
): Promise<ActionResult> {
  try {
    const updates: Record<string, unknown> = {}
    const allowedFields = [
      'content', 'platforms', 'scheduled_at', 'status', 'photo_urls',
      'tags', 'notes', 'photo_source', 'ai_generated',
    ]

    for (const field of allowedFields) {
      if (field in input) {
        updates[field] = (input as Record<string, unknown>)[field]
      }
    }

    // Update content_hash if content changed
    if (input.content) {
      updates.content_hash = getContentHash(input.content)
    }

    const data = await updatePostWithVersion(id, updates, expectedVersion)
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to update post' }
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  try {
    const { error } = await supabaseAdmin
      .from('cc_posts')
      .delete()
      .eq('id', id)

    if (error) return { success: false, error: error.message }

    revalidatePath('/pipeline')
    revalidatePath('/')
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to delete post' }
  }
}

// ── Workflow Actions ────────────────────────────────────────

export async function approveIdea(id: string): Promise<ActionResult> {
  try {
    const post = await getPost(id)
    if (post.status !== 'idea') {
      return { success: false, error: `Cannot approve idea: post is in "${post.status}" status` }
    }

    const data = await updatePostWithVersion(id, {
      status: 'idea_approved',
    }, post.version)

    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to approve idea' }
  }
}

export async function approveTextOnly(id: string): Promise<ActionResult> {
  try {
    const post = await getPost(id)
    if (!['idea', 'idea_approved'].includes(post.status)) {
      return { success: false, error: `Cannot approve text-only from "${post.status}" status` }
    }

    const data = await updatePostWithVersion(id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
    }, post.version)

    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to approve' }
  }
}

export async function approvePhotos(id: string): Promise<ActionResult> {
  try {
    const post = await getPost(id)
    if (post.status !== 'photo_review') {
      return { success: false, error: `Cannot approve photos from "${post.status}" status` }
    }

    if (!post.photo_urls || post.photo_urls.length === 0) {
      return { success: false, error: 'No photos to approve' }
    }

    const data = await updatePostWithVersion(id, {
      status: 'approved',
      approved_at: new Date().toISOString(),
    }, post.version)

    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to approve photos' }
  }
}

export async function rejectPost(id: string, reason?: string): Promise<ActionResult> {
  try {
    const post = await getPost(id)
    const notes = reason
      ? `${post.notes ? post.notes + '\n' : ''}[REJECTED] ${reason}`
      : post.notes

    const data = await updatePostWithVersion(id, {
      status: 'idea',
      notes,
    }, post.version)

    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to reject post' }
  }
}

export async function schedulePost(id: string, scheduledAt: string): Promise<ActionResult> {
  try {
    const post = await getPost(id)
    if (post.status !== 'approved') {
      return { success: false, error: `Cannot schedule: post is in "${post.status}" status, needs to be "approved"` }
    }

    // Create publish queue entries
    const queueItems = (post.platforms || []).map((platform: string) => ({
      post_id: id,
      platform,
      content: post.content,
      photo_urls: post.photo_urls || [],
      scheduled_at: scheduledAt,
      status: 'pending',
    }))

    // Try inserting into publish queue (table may not exist yet)
    try {
      await supabaseAdmin.from('cc_publish_queue').insert(queueItems)
    } catch {
      // Queue table doesn't exist yet — that's OK, autopublish cron will handle it
    }

    const data = await updatePostWithVersion(id, {
      status: 'approved', // Keep approved, cron will pick it up
      scheduled_at: scheduledAt,
    }, post.version)

    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to schedule post' }
  }
}

export async function publishPost(id: string): Promise<ActionResult> {
  try {
    const post = await getPost(id)

    // Validation
    const validationErrors = validatePost(
      post.content,
      post.platforms,
      post.photo_urls || [],
      post.status
    )

    if (hasBlockingErrors(validationErrors)) {
      const blocking = validationErrors.filter((e: { severity: string }) => e.severity === 'error')
      return {
        success: false,
        error: `Validation failed: ${blocking.map((e: { message: string }) => e.message).join('; ')}`,
      }
    }

    // Enhance photos
    let photoUrls = post.photo_urls || []
    if (photoUrls.length > 0) {
      try {
        photoUrls = await enhancePhotosForPost(photoUrls)
        await supabaseAdmin
          .from('cc_posts')
          .update({ photo_urls: photoUrls })
          .eq('id', id)
      } catch {
        // Use originals on enhancement failure
      }
    }

    // Publish to all platforms
    const results: Record<string, PublishResult> = {}
    const postedIds: Record<string, string> = {}
    let anySuccess = false

    for (const platform of post.platforms) {
      const result = await publishToPlatform(platform, post.content, photoUrls)
      results[platform] = result
      if (result.success && result.postId) {
        postedIds[platform] = result.postId
        anySuccess = true
      }
    }

    const newStatus = anySuccess ? 'posted' : 'failed'
    const failedPlatforms = Object.entries(results)
      .filter(([, r]) => !r.success)
      .map(([p, r]) => `${p}: ${r.error}`)

    const updatedNotes = failedPlatforms.length > 0
      ? `${post.notes ? post.notes + '\n' : ''}[PUBLISH ${new Date().toISOString()}] Failures: ${failedPlatforms.join('; ')}`
      : post.notes

    const data = await updatePostWithVersion(id, {
      status: newStatus,
      posted_ids: { ...(post.posted_ids || {}), ...postedIds },
      photo_urls: photoUrls,
      notes: updatedNotes,
      published_at: anySuccess ? new Date().toISOString() : null,
    }, post.version)

    return {
      success: anySuccess,
      data: {
        post: data,
        results,
        summary: {
          total: post.platforms.length,
          succeeded: Object.values(results).filter(r => r.success).length,
          failed: Object.values(results).filter(r => !r.success).length,
        },
      },
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to publish' }
  }
}

export async function bulkMove(
  postIds: string[],
  targetStatus: string
): Promise<ActionResult> {
  try {
    const now = new Date().toISOString()
    const updates: Record<string, unknown> = {
      status: targetStatus,
      updated_at: now,
    }

    if (targetStatus === 'approved') {
      updates.approved_at = now
    }

    const { data, error } = await supabaseAdmin
      .from('cc_posts')
      .update(updates)
      .in('id', postIds)
      .select()

    if (error) return { success: false, error: error.message }

    revalidatePath('/pipeline')
    revalidatePath('/')
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to bulk move' }
  }
}
