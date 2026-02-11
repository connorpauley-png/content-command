'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, addMonths } from 'date-fns'
import {
  Plus,
  CalendarPlus,
  Loader2,
  Lightbulb,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { CalendarEvent } from '@/lib/supabase'

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  holiday: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-700',
  },
  industry: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-l-green-500',
    badge: 'bg-green-100 text-green-700',
  },
  local: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-700',
  },
  custom: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-l-purple-500',
    badge: 'bg-purple-100 text-purple-700',
  },
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [newName, setNewName] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newType, setNewType] = useState<string>('custom')
  const [newDescription, setNewDescription] = useState('')
  const [newIdeas, setNewIdeas] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    try {
      const now = new Date()
      const future = addMonths(now, 6)
      const res = await fetch(
        `/api/events?from=${format(now, 'yyyy-MM-dd')}&to=${format(future, 'yyyy-MM-dd')}`
      )
      if (res.ok) {
        const data = await res.json()
        setEvents(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Failed to load events:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateEvent() {
    if (!newName || !newDate) return
    setSaving(true)
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          event_date: newDate,
          event_type: newType,
          description: newDescription || null,
          content_ideas: newIdeas
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean),
        }),
      })
      if (res.ok) {
        setDialogOpen(false)
        setNewName('')
        setNewDate('')
        setNewType('custom')
        setNewDescription('')
        setNewIdeas('')
        loadEvents()
      } else {
        const err = await res.json()
        alert(`Failed: ${err.error}`)
      }
    } catch {
      alert('Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  function createPostFromEvent(event: CalendarEvent) {
    const ideas = event.content_ideas?.length
      ? `\n\nContent ideas:\n${event.content_ideas.map((i) => `• ${i}`).join('\n')}`
      : ''
    const content = `${event.name}${event.description ? `\n${event.description}` : ''}${ideas}`
    const params = new URLSearchParams({
      content,
      scheduled_at: new Date(event.event_date + 'T09:00:00').toISOString(),
    })
    router.push(`/posts/new?${params.toString()}`)
  }

  // Group events by month
  const grouped: Record<string, CalendarEvent[]> = {}
  for (const event of events) {
    const month = format(new Date(event.event_date + 'T00:00:00'), 'MMMM yyyy')
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(event)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events & Holidays</h1>
          <p className="text-sm text-gray-500 mt-1">
            Plan content around holidays, industry events, and local happenings
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#254421] hover:bg-[#1a3318] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Event Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Spring Cleanup Season Start"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="holiday">Holiday</SelectItem>
                    <SelectItem value="industry">Industry</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description..."
                />
              </div>
              <div>
                <Label>Content Ideas (one per line)</Label>
                <Textarea
                  value={newIdeas}
                  onChange={(e) => setNewIdeas(e.target.value)}
                  placeholder="Post a before/after photo&#10;Share a tip about..."
                  className="min-h-[100px]"
                />
              </div>
              <Button
                className="w-full bg-[#254421] hover:bg-[#1a3318] text-white"
                onClick={handleCreateEvent}
                disabled={saving || !newName || !newDate}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        {Object.entries(EVENT_TYPE_COLORS).map(([type, colors]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${colors.badge.split(' ')[0]}`} />
            <span className="text-gray-600 capitalize">{type}</span>
          </span>
        ))}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-400">
            <p>No upcoming events found.</p>
            <p className="text-sm mt-1">Add your first event to start planning content.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([month, monthEvents]) => (
          <div key={month} className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">
              {month}
            </h2>
            {monthEvents.map((event) => {
              const colors = EVENT_TYPE_COLORS[event.event_type] || EVENT_TYPE_COLORS.custom
              return (
                <Card
                  key={event.id}
                  className={`border-l-4 ${colors.border}`}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {event.name}
                          </h3>
                          <Badge variant="secondary" className={colors.badge}>
                            {event.event_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {format(new Date(event.event_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                        </p>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {event.description}
                          </p>
                        )}
                        {event.content_ideas && event.content_ideas.length > 0 && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                              <Lightbulb className="w-3.5 h-3.5" />
                              Content Ideas
                            </div>
                            <ul className="space-y-1">
                              {event.content_ideas.map((idea, i) => (
                                <li key={i} className="text-sm text-gray-700 flex gap-2">
                                  <span className="text-gray-300">•</span>
                                  {idea}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createPostFromEvent(event)}
                        className="shrink-0"
                      >
                        <CalendarPlus className="w-4 h-4 mr-1" />
                        Create Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
