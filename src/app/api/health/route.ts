import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/health — scheduler status, token status, pending queue
export async function GET() {
  const now = new Date().toISOString()
  const checks: Record<string, unknown> = {
    status: 'ok',
    timestamp: now,
  }

  // Pending posts (approved + due)
  try {
    const { data: pendingPosts, error } = await supabaseAdmin
      .from('cc_posts')
      .select('id, scheduled_at, platforms, status')
      .eq('status', 'approved')
      .lte('scheduled_at', now)

    checks.pendingPosts = {
      count: pendingPosts?.length || 0,
      posts: pendingPosts || [],
      error: error?.message,
    }
  } catch {
    checks.pendingPosts = { count: 0, error: 'Query failed' }
  }

  // Publish queue status (if table exists)
  try {
    const { data: queueItems } = await supabaseAdmin
      .from('cc_publish_queue')
      .select('status')

    if (queueItems) {
      const grouped = queueItems.reduce((acc: Record<string, number>, item: { status: string }) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {})
      checks.publishQueue = grouped
    }
  } catch {
    checks.publishQueue = { note: 'cc_publish_queue table not yet created' }
  }

  // Platform token status (if table exists)
  try {
    const { data: tokens } = await supabaseAdmin
      .from('cc_platform_tokens')
      .select('platform, status, expires_at, last_used_at')

    if (tokens && tokens.length > 0) {
      checks.tokens = tokens
    } else {
      checks.tokens = { note: 'Using env var tokens (not yet migrated to DB)' }
    }
  } catch {
    checks.tokens = { note: 'cc_platform_tokens table not yet created' }
  }

  // Post stats
  try {
    const { data: stats } = await supabaseAdmin
      .from('cc_posts')
      .select('status')

    if (stats) {
      const grouped = stats.reduce((acc: Record<string, number>, item: { status: string }) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {})
      checks.postStats = grouped
    }
  } catch {
    checks.postStats = {}
  }

  return NextResponse.json(checks)
}
