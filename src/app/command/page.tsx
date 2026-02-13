'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ListTodo,
  Users,
  FileText,
  Activity,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DashboardData {
  tasks: Array<{
    id: string
    title: string
    status: string
    priority: number
    due_date?: string
    category?: string
  }>
  pipeline: {
    counts: { approved: number; idea_approved: number; posted: number }
    scheduled: Array<{
      id: string
      title?: string
      caption?: string
      platform?: string
      scheduled_at: string
      status: string
    }>
  }
  crm: {
    topContacts: Array<{
      id: string
      name: string
      company?: string
      role?: string
      score: number
      last_touch?: string
    }>
    staleContacts: Array<{
      id: string
      name: string
      company?: string
      score: number
      last_touch?: string
    }>
    totalContacts: number
  }
  jobHealth: {
    generated_at: string
    overall: string
    summary: { total: number; ok: number; warnings: number; failed: number; missed: number; unknown: number }
    jobs: Array<{
      name: string
      status: string
      detail: string
      last_run?: string
    }>
  } | null
  stats: {
    postsThisWeek: number
    totalContacts: number
    activeTasks: number
  }
}

function StatusIcon({ status }: { status: string }) {
  const s = status.toUpperCase()
  if (s === 'OK' || s === 'HEALTHY') return <CheckCircle2 className="h-4 w-4 text-[#254421]" />
  if (s === 'WARNING') return <AlertTriangle className="h-4 w-4 text-[#e2b93b]" />
  if (s === 'FAILED' || s === 'MISSED') return <XCircle className="h-4 w-4 text-red-500" />
  return <HelpCircle className="h-4 w-4 text-zinc-500" />
}

function priorityLabel(p: number) {
  if (p >= 4) return 'Critical'
  if (p === 3) return 'High'
  if (p === 2) return 'Medium'
  return 'Low'
}

function priorityColor(p: number) {
  if (p >= 4) return 'bg-red-500/20 text-red-400 border-red-500/30'
  if (p === 3) return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  if (p === 2) return 'bg-[#e2b93b]/20 text-[#e2b93b] border-[#e2b93b]/30'
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
}

function daysAgo(dateStr: string | undefined) {
  if (!dateStr) return null
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return '1 day ago'
  return `${d} days ago`
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function CommandCenterPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/command')
      if (!res.ok) throw new Error('Failed to fetch')
      setData(await res.json())
      setError(null)
    } catch {
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading && !data) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-6 w-6 animate-spin text-[#e2b93b]" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-4 md:p-8">
        <p className="text-red-400">{error}</p>
        <Button onClick={fetchData} className="mt-4">Retry</Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-4 md:p-8 space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Command Center</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="border-zinc-700 text-zinc-300"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#e2b93b]">{data.stats.activeTasks}</div>
            <div className="text-xs text-zinc-400 mt-1">Active Tasks</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-[#254421]" style={{ color: '#5a9e4f' }}>{data.stats.postsThisWeek}</div>
            <div className="text-xs text-zinc-400 mt-1">Posts This Week</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-zinc-200">{data.stats.totalContacts}</div>
            <div className="text-xs text-zinc-400 mt-1">Contacts</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Widget */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <ListTodo className="h-4 w-4 text-[#e2b93b]" />
            Tasks
            {data.tasks.length > 0 && (
              <Badge variant="outline" className="ml-auto text-xs border-zinc-700 text-zinc-400">
                {data.tasks.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.tasks.length === 0 ? (
            <p className="text-sm text-zinc-500">No active tasks</p>
          ) : (
            data.tasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-2 rounded-lg bg-zinc-800/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-zinc-200 truncate">{task.title}</span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColor(task.priority)}`}>
                      {priorityLabel(task.priority)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {task.status === 'in_progress' && (
                      <span className="text-[10px] text-[#e2b93b]">In Progress</span>
                    )}
                    {task.status === 'pending' && (
                      <span className="text-[10px] text-zinc-500">Pending</span>
                    )}
                    {task.due_date && (
                      <span className="text-[10px] text-zinc-500">Due: {formatDate(task.due_date)}</span>
                    )}
                    {task.category && (
                      <span className="text-[10px] text-zinc-600">{task.category}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Content Pipeline Widget */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <FileText className="h-4 w-4 text-[#e2b93b]" />
            Content Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-[#e2b93b]">{data.pipeline.counts.idea_approved}</div>
              <div className="text-[10px] text-zinc-500">Ideas Approved</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold" style={{ color: '#5a9e4f' }}>{data.pipeline.counts.approved}</div>
              <div className="text-[10px] text-zinc-500">Approved</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-zinc-300">{data.pipeline.counts.posted}</div>
              <div className="text-[10px] text-zinc-500">Posted</div>
            </div>
          </div>
          {data.pipeline.scheduled.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-400 mb-2">Upcoming</h4>
              {data.pipeline.scheduled.map(post => (
                <div key={post.id} className="flex items-center gap-2 py-1.5 border-b border-zinc-800 last:border-0">
                  <Clock className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                  <span className="text-sm text-zinc-300 truncate flex-1">
                    {post.title || post.caption?.slice(0, 60) || 'Untitled'}
                  </span>
                  <span className="text-[10px] text-zinc-500 flex-shrink-0">
                    {formatDate(post.scheduled_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRM Widget */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Users className="h-4 w-4 text-[#e2b93b]" />
            CRM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Top Contacts */}
          <div>
            <h4 className="text-xs font-medium text-zinc-400 mb-2">Top Contacts</h4>
            <div className="space-y-1">
              {data.crm.topContacts.map(c => (
                <div key={c.id} className="flex items-center gap-2 py-1.5 px-2 rounded bg-zinc-800/30">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-200 truncate">{c.name}</div>
                    {c.company && <div className="text-[10px] text-zinc-500 truncate">{c.company}{c.role ? ` - ${c.role}` : ''}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-medium text-[#e2b93b]">{c.score}</div>
                    <div className="text-[10px] text-zinc-600">{daysAgo(c.last_touch)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Stale Contacts */}
          {data.crm.staleContacts.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-[#e2b93b]" />
                Needs Follow-up (30+ days)
              </h4>
              <div className="space-y-1">
                {data.crm.staleContacts.map(c => (
                  <div key={c.id} className="flex items-center gap-2 py-1 px-2 rounded bg-zinc-800/30">
                    <span className="text-sm text-zinc-300 truncate flex-1">{c.name}</span>
                    <span className="text-[10px] text-zinc-500 flex-shrink-0">{daysAgo(c.last_touch)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Health Widget */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Activity className="h-4 w-4 text-[#e2b93b]" />
            Job Health
            {data.jobHealth && (
              <Badge
                variant="outline"
                className={`ml-auto text-[10px] ${
                  data.jobHealth.overall === 'HEALTHY'
                    ? 'border-green-700 text-green-400'
                    : data.jobHealth.overall === 'WARNING'
                    ? 'border-[#e2b93b]/50 text-[#e2b93b]'
                    : 'border-red-700 text-red-400'
                }`}
              >
                {data.jobHealth.overall}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data.jobHealth ? (
            <p className="text-sm text-zinc-500">Health report not available</p>
          ) : (
            <div className="space-y-1.5">
              {data.jobHealth.jobs.map(job => (
                <div key={job.name} className="flex items-center gap-2 py-1.5 px-2 rounded bg-zinc-800/30">
                  <StatusIcon status={job.status} />
                  <span className="text-sm text-zinc-300 flex-1">{job.name}</span>
                  <span className="text-[10px] text-zinc-500 max-w-[120px] truncate">{job.detail}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
