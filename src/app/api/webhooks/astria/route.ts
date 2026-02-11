import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/webhooks/astria — callback when image generation completes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Astria webhook payload: { id, status, images, error }
    const promptId = String(body.id || body.prompt_id)
    const images = body.images || []
    const error = body.error || body.user_error

    if (!promptId) {
      return NextResponse.json({ error: 'Missing prompt ID' }, { status: 400 })
    }

    // Find the post with this generation ID
    // Try generation_id column first, fall back to notes search
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let post: any = null

    // Try generation_id column first
    try {
      const { data: directMatch } = await supabaseAdmin
        .from('cc_posts')
        .select('*')
        .eq('generation_id', promptId)
        .eq('status', 'generating')
        .single()
      if (directMatch) post = directMatch
    } catch { /* column may not exist */ }

    if (!post) {
      // Search in notes for [GENERATION_ID] tag
      try {
        const { data: noteMatch } = await supabaseAdmin
          .from('cc_posts')
          .select('*')
          .eq('status', 'generating')
          .ilike('notes', `%[GENERATION_ID] ${promptId}%`)
          .single()
        if (noteMatch) post = noteMatch
      } catch { /* no match */ }
    }

    if (!post) {
      // Not found — might have been deleted or already processed
      return NextResponse.json({ message: 'No matching post found', promptId })
    }

    if (images.length > 0) {
      // Success: attach images and move to photo_review
      await supabaseAdmin
        .from('cc_posts')
        .update({
          photo_urls: images,
          status: 'photo_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id)

      return NextResponse.json({
        success: true,
        postId: post.id,
        images: images.length,
      })
    }

    if (error) {
      // Failed: revert to idea_approved
      await supabaseAdmin
        .from('cc_posts')
        .update({
          status: 'idea_approved',
          notes: `${post.notes || ''}\n[AI FAILED] ${error}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id)

      return NextResponse.json({
        success: false,
        postId: post.id,
        error,
      })
    }

    return NextResponse.json({ message: 'No images or error in payload' })
  } catch (e) {
    console.error('Astria webhook error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
