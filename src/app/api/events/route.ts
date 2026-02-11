import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const type = searchParams.get('type')

  let query = supabaseAdmin
    .from('cc_events')
    .select('*')
    .order('event_date', { ascending: true })

  if (from) {
    query = query.gte('event_date', from)
  }
  if (to) {
    query = query.lte('event_date', to)
  }
  if (type) {
    query = query.eq('event_type', type)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  const { data, error } = await supabaseAdmin
    .from('cc_events')
    .insert({
      name: body.name,
      event_date: body.event_date,
      event_type: body.event_type || 'custom',
      description: body.description || null,
      content_ideas: body.content_ideas || [],
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
