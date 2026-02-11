import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  // Only update fields that were actually provided in the request body
  const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const allowedFields = [
    'content', 'platforms', 'scheduled_at', 'status', 'photo_urls',
    'posted_ids', 'tags', 'notes', 'photo_source', 'ai_generated', 'content_hash'
  ]
  for (const field of allowedFields) {
    if (field in body) {
      updateFields[field] = body[field]
    }
  }

  const { data, error } = await supabaseAdmin
    .from('cc_posts')
    .update(updateFields)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabaseAdmin
    .from('cc_posts')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
