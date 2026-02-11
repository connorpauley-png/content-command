import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Submit a new post idea (used by Jarvis)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, platforms, tags, notes, scheduledAt } = body

    if (!content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 })
    }

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'at least one platform required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('cc_posts')
      .insert({
        content,
        platforms,
        tags: tags || [],
        notes: notes || null,
        scheduled_at: scheduledAt || null,
        status: 'idea',
        photo_urls: [],
        photo_source: null,
        ai_generated: false,
        posted_ids: {},
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, post: data })
  } catch (error) {
    console.error('Ideas error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create idea' },
      { status: 500 }
    )
  }
}

// Get all ideas pending approval
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('status', 'idea')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ideas: data })
}
