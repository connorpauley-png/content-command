'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { Plus, Calendar, Clock, CheckCircle, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Post, CalendarEvent } from '@/lib/supabase'
import { PLATFORMS, STATUS_COLORS } from '@/lib/supabase'

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [setupError, setSetupError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const now = new Date()
        const weekEnd = addDays(now, 7)

        const [postsRes, eventsRes] = await Promise.all([
          fetch(`/api/posts?from=${now.toISOString()}&to=${weekEnd.toISOString()}`),
          fetch(`/api/events?from=${format(now, 'yyyy-MM-dd')}&to=${format(weekEnd, 'yyyy-MM-dd')}`),
        ])

        if (postsRes.ok) {
          const postsData = await postsRes.json()
          setPosts(Array.isArray(postsData) ? postsData : [])
        }
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setEvents(Array.isArray(eventsData) ? eventsData : [])
        }
      } catch (e: any) {
        console.error('Failed to load dashboard data:', e)
        setSetupError(e?.message || 'Failed to connect. Check your environment variables.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Compute stats
  const weekStart = startOfWeek(new Date())
  const weekEndDate = endOfWeek(new Date())
  const allPostsThisWeek = posts.filter((p) => {
    if (!p.scheduled_at) return false
    const d = new Date(p.scheduled_at)
    return d >= weekStart && d <= weekEndDate
  })
  const pendingPosts = posts.filter((p) => ['idea', 'idea_approved', 'generating', 'photo_review'].includes(p.status))
  const publishedPosts = posts.filter((p) => p.status === 'posted')

  const platformById = (id: string) => PLATFORMS.find((p) => p.id === id)

  if (setupError) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚀 Setup Required</h1>
        <p style={{ color: '#666' }}>Content Command couldn&apos;t connect to your backend. Follow these steps to get started:</p>
        <ol style={{ lineHeight: '2' }}>
          <li>Copy <code>.env.example</code> to <code>.env.local</code> and fill in your API keys</li>
          <li>Run the migration SQL in your Supabase SQL Editor</li>
          <li>Restart the dev server: <code>npm run dev</code></li>
        </ol>
        <p style={{ marginTop: '1rem' }}>
          📖 See the <a href="https://github.com/your-repo/content-command-v3#readme" style={{ color: '#254421', textDecoration: 'underline' }}>README</a> for full instructions.
        </p>
        <p style={{ color: '#999', fontSize: '0.8rem', marginTop: '1rem' }}>Error: {setupError}</p>
        <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', background: '#254421', color: 'white', border: 'none', borderRadius: '0.375rem' }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Link href="/posts/new">
          <Button className="bg-[#254421] hover:bg-[#1a3318] text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#254421]/10 rounded-lg">
                <Calendar className="w-5 h-5 text-[#254421]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allPostsThisWeek.length}</p>
                <p className="text-xs text-gray-500">Posts This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingPosts.length}</p>
                <p className="text-xs text-gray-500">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publishedPosts.length}</p>
                <p className="text-xs text-gray-500">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{posts.length}</p>
                <p className="text-xs text-gray-500">Upcoming (7 days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Posts */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Posts</h2>
          {loading ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-400">
                Loading...
              </CardContent>
            </Card>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-400">
                <p>No upcoming posts in the next 7 days.</p>
                <Link href="/posts/new" className="text-[#254421] underline text-sm mt-2 inline-block">
                  Create your first post →
                </Link>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-4">
                      {/* Photo thumbnail */}
                      {post.photo_urls && post.photo_urls.length > 0 && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                          <img
                            src={post.photo_urls[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Content preview */}
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {post.content || <span className="italic text-gray-400">No content yet</span>}
                        </p>
                        {/* Meta row */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={STATUS_COLORS[post.status]}
                          >
                            {post.status}
                          </Badge>
                          {post.scheduled_at && (
                            <span className="text-xs text-gray-500">
                              {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}
                            </span>
                          )}
                          {/* Platform badges */}
                          <div className="flex gap-1 ml-auto">
                            {post.platforms?.map((pid) => {
                              const pl = platformById(pid)
                              return pl ? (
                                <span
                                  key={pid}
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${pl.color}`}
                                  title={pl.name}
                                >
                                  {pl.icon}
                                </span>
                              ) : null
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
          {loading ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-400">
                Loading...
              </CardContent>
            </Card>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-400">
                <p className="text-sm">No events this week.</p>
                <Link href="/events" className="text-[#254421] underline text-sm mt-2 inline-block">
                  View all events →
                </Link>
              </CardContent>
            </Card>
          ) : (
            events.map((event) => {
              const typeColors: Record<string, string> = {
                holiday: 'bg-red-100 text-red-700 border-red-200',
                industry: 'bg-green-100 text-green-700 border-green-200',
                local: 'bg-blue-100 text-blue-700 border-blue-200',
                custom: 'bg-purple-100 text-purple-700 border-purple-200',
              }
              return (
                <Card key={event.id} className={`border-l-4 ${typeColors[event.event_type]?.split(' ').pop() || 'border-gray-200'}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{event.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {format(new Date(event.event_date + 'T00:00:00'), 'MMM d, yyyy')}
                        </p>
                        {event.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={typeColors[event.event_type] || 'bg-gray-100 text-gray-700'}
                      >
                        {event.event_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
          <Link href="/events">
            <Button variant="outline" size="sm" className="w-full mt-2">
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
