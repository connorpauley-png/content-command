import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getContentHash, checkDuplicate } from '@/lib/dedup'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabaseAdmin
    .from('cc_posts')
    .select('*')
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }
  if (from) {
    query = query.gte('scheduled_at', from)
  }
  if (to) {
    query = query.lte('scheduled_at', to)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const content = body.content || ''
  const platforms = body.platforms || []

  // Check for duplicates unless explicitly skipped
  if (!body.skip_dedup && content && platforms.length > 0) {
    const dupCheck = await checkDuplicate(content, platforms)
    if (dupCheck.isDuplicate) {
      return NextResponse.json({
        error: 'Duplicate content detected',
        duplicate: {
          type: dupCheck.matchType,
          matchedPostId: dupCheck.matchedPostId,
          matchedContent: dupCheck.matchedContent,
          similarity: dupCheck.similarity,
        },
      }, { status: 409 })
    }
  }

  const { data, error } = await supabaseAdmin
    .from('cc_posts')
    .insert({
      content,
      platforms,
      scheduled_at: body.scheduled_at || null,
      status: body.status || 'draft',
      photo_urls: body.photo_urls || [],
      posted_ids: body.posted_ids || {},
      tags: body.tags || [],
      notes: body.notes || null,
      content_hash: content ? getContentHash(content) : null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
