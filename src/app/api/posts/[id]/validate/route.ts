import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { validatePost, hasBlockingErrors, getErrorsByPlatform } from '@/lib/validators'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: post, error } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const validationErrors = validatePost(
    post.content,
    post.platforms,
    post.photo_urls || [],
    post.status
  )

  const errors = validationErrors.filter((e) => e.severity === 'error')
  const warnings = validationErrors.filter((e) => e.severity === 'warning')

  return NextResponse.json({
    valid: !hasBlockingErrors(validationErrors),
    errors,
    warnings,
    byPlatform: getErrorsByPlatform(validationErrors),
    summary: [
      ...errors.map((e) => {
        const prefix = e.platform === 'all' ? '' : `[${e.platform.toUpperCase()}] `
        return `❌ ${prefix}${e.message}`
      }),
      ...warnings.map((e) => {
        const prefix = e.platform === 'all' ? '' : `[${e.platform.toUpperCase()}] `
        return `⚠️ ${prefix}${e.message}`
      }),
    ],
  })
}
