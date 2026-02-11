import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { publishToPlatform } from '@/lib/publishers'
import { validatePost, hasBlockingErrors, getErrorsByPlatform } from '@/lib/validators'
import { enhancePhotosForPost } from '@/lib/enhance'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Get the post
  const { data: post, error: fetchError } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // ── Validation gate ──────────────────────────────────────
  const validationErrors = validatePost(
    post.content,
    post.platforms,
    post.photo_urls || [],
    post.status
  )

  if (hasBlockingErrors(validationErrors)) {
    const grouped = getErrorsByPlatform(validationErrors)
    const blocking = validationErrors.filter((e) => e.severity === 'error')

    return NextResponse.json(
      {
        error: 'Post failed validation. Fix the issues below before publishing.',
        validation: {
          errors: blocking,
          warnings: validationErrors.filter((e) => e.severity === 'warning'),
          byPlatform: grouped,
          summary: blocking.map((e) => {
            const prefix = e.platform === 'all' ? '' : `[${e.platform.toUpperCase()}] `
            return `${prefix}${e.message}`
          }),
        },
      },
      { status: 422 }
    )
  }

  // ── Auto-enhance photos ──────────────────────────────────
  let photoUrls = post.photo_urls || []
  if (photoUrls.length > 0) {
    try {
      photoUrls = await enhancePhotosForPost(photoUrls)
      // Save enhanced URLs back to the post
      await supabaseAdmin
        .from('cc_posts')
        .update({ photo_urls: photoUrls })
        .eq('id', params.id)
    } catch (err) {
      console.error('Photo enhancement failed, using originals:', err)
    }
  }

  // ── Publish to each platform ─────────────────────────────
  const results: Record<string, { success: boolean; postId?: string; error?: string }> = {}
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

  // Determine final status
  const newStatus = anySuccess ? 'posted' : 'failed'

  const failedPlatforms = Object.entries(results)
    .filter(([, r]) => !r.success)
    .map(([p, r]) => `${p}: ${r.error}`)

  const updatedNotes = failedPlatforms.length > 0
    ? `${post.notes ? post.notes + '\n' : ''}[PUBLISH ${new Date().toISOString()}] Failures: ${failedPlatforms.join('; ')}`
    : post.notes

  // Update post status
  const { data, error } = await supabaseAdmin
    .from('cc_posts')
    .update({
      status: newStatus,
      posted_ids: { ...(post.posted_ids || {}), ...postedIds },
      photo_urls: photoUrls,
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Include warnings in successful response too
  const warnings = validationErrors.filter((e) => e.severity === 'warning')

  return NextResponse.json({
    success: anySuccess,
    post: data,
    results,
    warnings: warnings.length > 0 ? warnings : undefined,
    summary: {
      total: post.platforms.length,
      succeeded: Object.values(results).filter((r) => r.success).length,
      failed: Object.values(results).filter((r) => !r.success).length,
    },
  })
}
