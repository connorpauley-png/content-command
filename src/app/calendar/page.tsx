'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Post, CalendarEvent } from '@/lib/supabase'
import { STATUS_COLORS } from '@/lib/supabase'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      const calStart = startOfWeek(monthStart)
      const calEnd = endOfWeek(monthEnd)

      try {
        const [postsRes, eventsRes] = await Promise.all([
          fetch(`/api/posts?from=${calStart.toISOString()}&to=${calEnd.toISOString()}&limit=200`),
          fetch(`/api/events?from=${format(calStart, 'yyyy-MM-dd')}&to=${format(calEnd, 'yyyy-MM-dd')}`),
        ])

        if (postsRes.ok) {
          const d = await postsRes.json()
          setPosts(Array.isArray(d) ? d : [])
        }
        if (eventsRes.ok) {
          const d = await eventsRes.json()
          setEvents(Array.isArray(d) ? d : [])
        }
      } catch (e) {
        console.error('Failed to load calendar data:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentMonth])

  // Build calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)

  const days: Date[] = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  function getPostsForDay(date: Date) {
    return posts.filter((p) => {
      if (!p.scheduled_at) return false
      return isSameDay(new Date(p.scheduled_at), date)
    })
  }

  function getEventsForDay(date: Date) {
    return events.filter((e) =>
      isSameDay(new Date(e.event_date + 'T00:00:00'), date)
    )
  }

  const eventTypeColors: Record<string, string> = {
    holiday: 'bg-red-500',
    industry: 'bg-green-500',
    local: 'bg-blue-500',
    custom: 'bg-purple-500',
  }

  const statusDotColors: Record<string, string> = {
    draft: 'bg-gray-400',
    pending: 'bg-yellow-400',
    approved: 'bg-green-500',
    posted: 'bg-blue-500',
    failed: 'bg-red-500',
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-semibold w-48 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="font-medium">Status:</span>
        {Object.entries(statusDotColors).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {status}
          </span>
        ))}
        <span className="mx-2 text-gray-300">|</span>
        <span className="font-medium">Events:</span>
        {Object.entries(eventTypeColors).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            {type}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="p-2 text-center text-xs font-medium text-gray-500">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((date) => {
              const dayPosts = getPostsForDay(date)
              const dayEvents = getEventsForDay(date)
              const inMonth = isSameMonth(date, currentMonth)
              const today = isToday(date)

              return (
                <div
                  key={date.toISOString()}
                  className={`min-h-[100px] p-1.5 border-r last:border-r-0 ${
                    inMonth ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium ${
                        today
                          ? 'bg-[#254421] text-white w-6 h-6 rounded-full flex items-center justify-center'
                          : inMonth
                          ? 'text-gray-700'
                          : 'text-gray-300'
                      }`}
                    >
                      {format(date, 'd')}
                    </span>
                  </div>

                  {/* Events */}
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`text-[10px] text-white rounded px-1 py-0.5 mb-0.5 truncate ${
                        eventTypeColors[event.event_type] || 'bg-gray-500'
                      }`}
                      title={event.name}
                    >
                      {event.name}
                    </div>
                  ))}

                  {/* Posts */}
                  {dayPosts.slice(0, 3).map((post) => (
                    <Link key={post.id} href={`/posts/${post.id}`}>
                      <div
                        className={`text-[10px] rounded px-1 py-0.5 mb-0.5 truncate cursor-pointer hover:opacity-80 ${
                          STATUS_COLORS[post.status]
                        }`}
                        title={post.content}
                      >
                        <span className="flex items-center gap-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotColors[post.status]}`} />
                          {post.content?.slice(0, 30) || 'Untitled'}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-[10px] text-gray-400">
                      +{dayPosts.length - 3} more
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
