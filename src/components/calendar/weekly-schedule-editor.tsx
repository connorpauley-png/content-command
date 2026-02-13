'use client'

import { useState, useMemo } from 'react'
import { useScheduleStore } from '@/lib/store/schedule'
import { useConfigStore } from '@/lib/store/config'
import { platformIcons } from '@/lib/platform-colors'
import type { CalendarSlot, ContentType } from '@/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

import { cn } from '@/lib/utils'
import { Plus, X, Wand2, Trash2 } from 'lucide-react'

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIME_SLOTS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00']

const CONTENT_TYPE_COLORS: Record<string, string> = {
  photo: 'bg-blue-500/80',
  video: 'bg-purple-500/80',
  reel: 'bg-pink-500/80',
  text: 'bg-gray-500/80',
  story: 'bg-orange-500/80',
  carousel: 'bg-teal-500/80',
  quote_card: 'bg-yellow-500/80',
  before_after: 'bg-green-500/80',
  testimonial: 'bg-amber-500/80',
  stat_card: 'bg-indigo-500/80',
  hot_take: 'bg-rose-500/80',
}

function getSlotColor(ct: string) {
  return CONTENT_TYPE_COLORS[ct] || 'bg-primary/80'
}

// Default templates by industry
const INDUSTRY_TEMPLATES: Record<string, Omit<CalendarSlot, 'accountId'>[]> = {
  landscaping: [
    { dayOfWeek: 1, contentType: 'before_after', pillar: 'Showcase Work', time: '09:00' },
    { dayOfWeek: 1, contentType: 'text', pillar: 'Education', time: '12:00' },
    { dayOfWeek: 2, contentType: 'photo', pillar: 'Behind the Scenes', time: '17:00' },
    { dayOfWeek: 3, contentType: 'reel', pillar: 'Showcase Work', time: '09:00' },
    { dayOfWeek: 3, contentType: 'text', pillar: 'Community', time: '12:00' },
    { dayOfWeek: 4, contentType: 'testimonial', pillar: 'Social Proof', time: '10:00' },
    { dayOfWeek: 5, contentType: 'photo', pillar: 'Showcase Work', time: '09:00' },
    { dayOfWeek: 5, contentType: 'hot_take', pillar: 'Engagement', time: '18:00' },
    { dayOfWeek: 6, contentType: 'crew_spotlight', pillar: 'Behind the Scenes', time: '10:00' },
  ],
  restaurant: [
    { dayOfWeek: 1, contentType: 'photo', pillar: 'Menu Highlights', time: '11:00' },
    { dayOfWeek: 2, contentType: 'reel', pillar: 'Behind the Scenes', time: '14:00' },
    { dayOfWeek: 3, contentType: 'testimonial', pillar: 'Social Proof', time: '12:00' },
    { dayOfWeek: 4, contentType: 'photo', pillar: 'Menu Highlights', time: '11:00' },
    { dayOfWeek: 5, contentType: 'story', pillar: 'Specials', time: '16:00' },
    { dayOfWeek: 6, contentType: 'carousel', pillar: 'Menu Highlights', time: '10:00' },
  ],
  default: [
    { dayOfWeek: 1, contentType: 'photo', time: '09:00' },
    { dayOfWeek: 2, contentType: 'text', time: '12:00' },
    { dayOfWeek: 3, contentType: 'reel', time: '09:00' },
    { dayOfWeek: 4, contentType: 'photo', time: '17:00' },
    { dayOfWeek: 5, contentType: 'text', time: '12:00' },
  ],
}

interface WeeklyScheduleEditorProps {
  className?: string
}

export function WeeklyScheduleEditor({ className }: WeeklyScheduleEditorProps) {
  const { weeklySlots, addSlot, removeSlot, clearWeek, setSlots } = useScheduleStore()
  const { getConfig } = useConfigStore()
  const config = getConfig()
  const enabledAccounts = config?.accounts?.filter(a => a.enabled) || []
  const industry = config?.business?.industry || 'default'

  const [addingSlot, setAddingSlot] = useState<{ dayOfWeek: number } | null>(null)
  const [newSlot, setNewSlot] = useState<Partial<CalendarSlot>>({})

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const map: Record<number, CalendarSlot[]> = {}
    for (let d = 0; d < 7; d++) map[d] = []
    weeklySlots.forEach(s => {
      if (!map[s.dayOfWeek]) map[s.dayOfWeek] = []
      map[s.dayOfWeek].push(s)
    })
    // Sort by time within each day
    Object.values(map).forEach(arr => arr.sort((a, b) => a.time.localeCompare(b.time)))
    return map
  }, [weeklySlots])

  const handleAutoFill = () => {
    const template = INDUSTRY_TEMPLATES[industry] || INDUSTRY_TEMPLATES.default
    if (enabledAccounts.length === 0) return

    const slots: CalendarSlot[] = template.map((t, i) => ({
      ...t,
      contentType: t.contentType as ContentType,
      accountId: enabledAccounts[i % enabledAccounts.length].id,
    }))
    setSlots(slots)
  }

  const handleAddSlot = () => {
    if (!addingSlot || !newSlot.accountId || !newSlot.contentType || !newSlot.time) return
    addSlot({
      dayOfWeek: addingSlot.dayOfWeek,
      accountId: newSlot.accountId,
      contentType: newSlot.contentType as ContentType,
      pillar: newSlot.pillar,
      time: newSlot.time,
    })
    setAddingSlot(null)
    setNewSlot({})
  }

  const totalSlots = weeklySlots.length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">Weekly Schedule</h3>
          <p className="text-xs text-muted-foreground">{totalSlots} post{totalSlots !== 1 ? 's' : ''} per week</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAutoFill}>
            <Wand2 className="h-3 w-3 mr-1" /> Auto-fill
          </Button>
          {weeklySlots.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearWeek} className="text-destructive">
              <Trash2 className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[600px]">
          {[1, 2, 3, 4, 5, 6, 0].map(day => (
            <div key={day} className="flex items-stretch border-b border-border last:border-0">
              <div className="w-24 flex-shrink-0 p-2 font-medium text-sm bg-card flex items-center">
                {DAY_LABELS[day]}
              </div>
              <div className="flex-1 p-2 flex flex-wrap gap-1.5 min-h-[48px] items-center">
                {slotsByDay[day]?.map((slot, idx) => {
                  const acc = enabledAccounts.find(a => a.id === slot.accountId)
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'group relative flex items-center gap-1 px-2 py-1 rounded text-xs text-white',
                        getSlotColor(slot.contentType)
                      )}
                    >
                      <span>{acc ? platformIcons[acc.platform] : ''}</span>
                      <span className="font-medium">{slot.contentType.replace(/_/g, ' ')}</span>
                      <span className="opacity-70">{slot.time}</span>
                      {slot.pillar && <span className="opacity-60">/ {slot.pillar}</span>}
                      <button
                        onClick={() => removeSlot(slot.dayOfWeek, slot.time, slot.accountId)}
                        className="opacity-0 group-hover:opacity-100 ml-1 hover:text-red-200 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
                <button
                  onClick={() => { setAddingSlot({ dayOfWeek: day }); setNewSlot({}) }}
                  className="h-7 w-7 rounded border border-dashed border-border flex items-center justify-center hover:bg-accent/50 transition-colors"
                >
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-2">
        {[1, 2, 3, 4, 5, 6, 0].map(day => (
          <Card key={day} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{DAY_LABELS_SHORT[day]}</span>
              <button
                onClick={() => { setAddingSlot({ dayOfWeek: day }); setNewSlot({}) }}
                className="h-6 w-6 rounded flex items-center justify-center hover:bg-accent/50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {slotsByDay[day]?.map((slot, idx) => {
                const acc = enabledAccounts.find(a => a.id === slot.accountId)
                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs text-white',
                      getSlotColor(slot.contentType)
                    )}
                  >
                    <span>{acc ? platformIcons[acc.platform] : ''}</span>
                    <span>{slot.time}</span>
                    <button onClick={() => removeSlot(slot.dayOfWeek, slot.time, slot.accountId)}>
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
              {(slotsByDay[day]?.length || 0) === 0 && (
                <span className="text-xs text-muted-foreground">No posts</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Slot Dialog */}
      <Dialog open={!!addingSlot} onOpenChange={open => { if (!open) setAddingSlot(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Slot — {addingSlot ? DAY_LABELS[addingSlot.dayOfWeek] : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account</Label>
              <Select value={newSlot.accountId || ''} onValueChange={v => setNewSlot(p => ({ ...p, accountId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {enabledAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {platformIcons[acc.platform]} @{acc.handle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content Type</Label>
              <Select value={newSlot.contentType || ''} onValueChange={v => setNewSlot(p => ({ ...p, contentType: v as ContentType }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {['photo', 'video', 'reel', 'text', 'story', 'carousel', 'quote_card', 'before_after', 'testimonial', 'stat_card', 'hot_take', 'crew_spotlight', 'tutorial'].map(ct => (
                    <SelectItem key={ct} value={ct}>{ct.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pillar (optional)</Label>
              <Select value={newSlot.pillar || '__none'} onValueChange={v => setNewSlot(p => ({ ...p, pillar: v === '__none' ? undefined : v }))}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {config?.strategy?.pillars?.map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Time</Label>
              <Select value={newSlot.time || ''} onValueChange={v => setNewSlot(p => ({ ...p, time: v }))}>
                <SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddSlot} className="w-full" disabled={!newSlot.accountId || !newSlot.contentType || !newSlot.time}>
              Add Slot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
