import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const CRM_DB = '/Users/clawdbot/.openclaw/workspace/scripts/personal-crm/crm.db'
const HEALTH_REPORT = '/Users/clawdbot/.openclaw/workspace/scripts/cron-monitor/health-report.json'

function querySqlite(query: string): string {
  try {
    return execSync(`sqlite3 -json "${CRM_DB}" "${query}"`, { encoding: 'utf-8' })
  } catch {
    return '[]'
  }
}

export async function GET() {
  try {
    // Tasks from Supabase
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('priority', { ascending: false })
      .limit(20)

    // Content pipeline from Supabase
    const { data: allPosts } = await supabase
      .from('cc_posts')
      .select('*')

    const postCounts = {
      approved: allPosts?.filter(p => p.status === 'approved').length || 0,
      idea_approved: allPosts?.filter(p => p.status === 'idea_approved').length || 0,
      posted: allPosts?.filter(p => p.status === 'posted').length || 0,
    }

    // Next 3 scheduled posts
    const now = new Date().toISOString()
    const scheduledPosts = (allPosts || [])
      .filter(p => p.scheduled_at && p.scheduled_at > now && p.status !== 'posted')
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
      .slice(0, 3)

    // Posts this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const postsThisWeek = (allPosts || []).filter(
      p => p.status === 'posted' && p.posted_at && new Date(p.posted_at) >= weekAgo
    ).length

    // CRM data from SQLite
    const topContacts = JSON.parse(querySqlite(
      "SELECT id, name, company, role, score, last_touch FROM contacts ORDER BY score DESC LIMIT 10"
    ))

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const staleContacts = JSON.parse(querySqlite(
      `SELECT id, name, company, score, last_touch FROM contacts WHERE last_touch < '${thirtyDaysAgo.toISOString().split('T')[0]}' AND score >= 50 ORDER BY score DESC LIMIT 10`
    ))

    const totalContacts = JSON.parse(querySqlite("SELECT COUNT(*) as count FROM contacts"))

    // Job health
    let jobHealth = null
    try {
      jobHealth = JSON.parse(readFileSync(HEALTH_REPORT, 'utf-8'))
    } catch {
      jobHealth = null
    }

    return NextResponse.json({
      tasks: tasks || [],
      pipeline: { counts: postCounts, scheduled: scheduledPosts },
      crm: { topContacts, staleContacts, totalContacts: totalContacts?.[0]?.count || 0 },
      jobHealth,
      stats: {
        postsThisWeek,
        totalContacts: totalContacts?.[0]?.count || 0,
        activeTasks: tasks?.length || 0,
      },
    })
  } catch (error) {
    console.error('Command center error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
