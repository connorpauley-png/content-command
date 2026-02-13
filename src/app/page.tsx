'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/lib/store/config'
import { usePostsStore } from '@/lib/store/config'
import { useClientStore } from '@/lib/store/clients'
import { platformAdapters } from '@/lib/platforms'
import { Sparkles, Calendar, Kanban, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import type { PostStatus } from '@/types'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const { getConfig } = useConfigStore()
  const { getClientPosts } = usePostsStore()
  const { currentClientId } = useClientStore()
  const config = getConfig()
  const posts = getClientPosts()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  if (!currentClientId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Content Command</CardTitle>
            <p className="text-muted-foreground mt-2">
              Let&apos;s get started by creating your first client.
            </p>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={() => router.push('/clients')}>
              Create First Client →
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!config?.setupComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to Content Command</CardTitle>
            <p className="text-muted-foreground mt-2">
              Let&apos;s set up your content automation platform. This takes about 5 minutes.
            </p>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={() => router.push('/setup')}>
              Start Setup →
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const accounts = config.accounts.filter((a) => a.enabled)
  const statusCounts: Record<PostStatus, number> = {
    idea: posts.filter((p) => p.status === 'idea').length,
    writing: posts.filter((p) => p.status === 'writing').length,
    needs_photos: posts.filter((p) => p.status === 'needs_photos').length,
    approve_photos: posts.filter((p) => p.status === 'approve_photos').length,
    review: posts.filter((p) => p.status === 'review').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    posted: posts.filter((p) => p.status === 'posted').length,
    failed: posts.filter((p) => p.status === 'failed').length,
  }

  const upcoming = posts
    .filter((p) => p.status === 'scheduled' && p.scheduledAt)
    .sort((a, b) => (a.scheduledAt! > b.scheduledAt! ? 1 : -1))
    .slice(0, 5)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{config.business.name}</h1>
          <p className="text-muted-foreground">Content Command Dashboard</p>
        </div>
        <Button asChild>
          <Link href="/pipeline">
            <Kanban className="h-4 w-4 mr-2" />
            Pipeline
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Ideas
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.idea}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Sparkles className="h-4 w-4" />
              In Progress
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.writing + statusCounts.review}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              Scheduled
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.scheduled}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Posted
            </div>
            <p className="text-2xl font-bold mt-1">{statusCounts.posted}</p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((account) => {
              const adapter = platformAdapters[account.platform]
              const accountPosts = posts.filter((p) => p.accountId === account.id)
              return (
                <div
                  key={account.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: adapter.color + '20' }}
                  >
                    {adapter.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{account.displayName || account.handle}</p>
                    <p className="text-xs text-muted-foreground">{adapter.displayName} · {account.postsPerWeek}/wk</p>
                  </div>
                  <Badge variant="secondary">{accountPosts.length}</Badge>
                </div>
              )
            })}
            {accounts.length === 0 && (
              <p className="text-muted-foreground col-span-full text-center py-4">
                No accounts configured.{' '}
                <Link href="/setup" className="text-primary hover:underline">Set up now</Link>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Upcoming Posts</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/calendar">
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((post) => {
                const account = config.accounts.find((a) => a.id === post.accountId)
                const adapter = account ? platformAdapters[account.platform] : null
                return (
                  <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <span className="text-lg">{adapter?.icon || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{post.content.slice(0, 80)}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No upcoming posts.{' '}
              <Link href="/pipeline" className="text-primary hover:underline">Create one</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
