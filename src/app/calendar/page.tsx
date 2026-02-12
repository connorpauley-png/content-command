'use client'

import { useState, useMemo } from 'react'
import { useConfigStore, usePostsStore } from '@/lib/store/config'
import { useClientStore } from '@/lib/store/clients'
import { platformColors, platformIcons } from '@/lib/platform-colors'
import type { Post, Platform } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function CalendarPage() {
  const { getConfig } = useConfigStore()
  const { getClientPosts, addPost, updatePost, deletePost } = usePostsStore()
  const { currentClientId } = useClientStore()
  const config = getConfig()
  const posts = getClientPosts()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [creatingPost, setCreatingPost] = useState(false)
  const [newPost, setNewPost] = useState({ accountId: '', content: '', hashtags: '', scheduledAt: '' })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const filteredPosts = useMemo(() => {
    let p = posts.filter(post => post.scheduledAt)
    if (filterAccount !== 'all') p = p.filter(post => post.accountId === filterAccount)
    return p
  }, [posts, filterAccount])

  const postsByDay = useMemo(() => {
    const map: Record<string, Post[]> = {}
    filteredPosts.forEach(post => {
      if (!post.scheduledAt) return
      const day = post.scheduledAt.slice(0, 10)
      if (!map[day]) map[day] = []
      map[day].push(post)
    })
    return map
  }, [filteredPosts])

  const selectedDayPosts = selectedDate ? (postsByDay[selectedDate] || []) : []

  const getAccountPlatform = (accountId: string): Platform => {
    return config?.accounts.find(a => a.id === accountId)?.platform || 'instagram'
  }

  const getAccountHandle = (accountId: string) => {
    return config?.accounts.find(a => a.id === accountId)?.handle || 'Unknown'
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => setCurrentDate(new Date())

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }

  const handleCreatePost = () => {
    if (!currentClientId || !newPost.accountId || !newPost.content) return
    const post: Post = {
      id: crypto.randomUUID(),
      clientId: currentClientId,
      accountId: newPost.accountId,
      platform: getAccountPlatform(newPost.accountId),
      status: 'scheduled',
      content: newPost.content,
      mediaUrls: [],
      hashtags: newPost.hashtags.split(/[,\s]+/).filter(Boolean),
      scheduledAt: newPost.scheduledAt || selectedDate + 'T12:00:00',
      aiGenerated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addPost(post)
    setCreatingPost(false)
    setNewPost({ accountId: '', content: '', hashtags: '', scheduledAt: '' })
  }

  const handleSaveEdit = () => {
    if (!editingPost) return
    updatePost(editingPost.id, {
      content: editingPost.content,
      hashtags: editingPost.hashtags,
      scheduledAt: editingPost.scheduledAt,
    })
    setEditingPost(null)
  }

  const calendarCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)
  while (calendarCells.length % 7 !== 0) calendarCells.push(null)

  if (!currentClientId || !config) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Client Selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select a client from the sidebar to view their content calendar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col p-4 md:p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{MONTH_NAMES[month]} {year}</h1>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
              <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {config?.accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>
                  {platformIcons[acc.platform]} {acc.handle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:block flex-1">
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden flex-1">
            {calendarCells.map((day, i) => {
              if (day === null) return <div key={i} className="bg-card/50 min-h-[100px]" />
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayPosts = postsByDay[dateStr] || []
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate

              return (
                <div
                  key={i}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'bg-card min-h-[100px] p-1.5 cursor-pointer hover:bg-accent/50 transition-colors',
                    isSelected && 'ring-2 ring-primary'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      'text-sm w-7 h-7 flex items-center justify-center rounded-full',
                      isToday && 'bg-primary text-primary-foreground font-bold'
                    )}>
                      {day}
                    </span>
                    {dayPosts.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">{dayPosts.length}</Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayPosts.slice(0, 3).map(post => {
                      const colors = platformColors[post.platform]
                      return (
                        <div
                          key={post.id}
                          onClick={(e) => { e.stopPropagation(); setEditingPost(post) }}
                          className={cn('text-[10px] px-1.5 py-0.5 rounded truncate', colors.pill)}
                        >
                          {post.content.slice(0, 30)}
                        </div>
                      )
                    })}
                    {dayPosts.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{dayPosts.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile List View */}
        <div className="md:hidden space-y-2">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayPosts = postsByDay[dateStr] || []
            if (dayPosts.length === 0) return null
            const isToday = dateStr === todayStr
            return (
              <Card key={day} className={cn('p-3', isToday && 'border-primary')}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">
                    {DAY_NAMES[new Date(year, month, day).getDay()]} {day}
                  </span>
                  <Badge variant="secondary">{dayPosts.length} posts</Badge>
                </div>
                <div className="space-y-1">
                  {dayPosts.map(post => {
                    const colors = platformColors[post.platform]
                    return (
                      <div
                        key={post.id}
                        onClick={() => setEditingPost(post)}
                        className={cn('text-xs px-2 py-1 rounded cursor-pointer', colors.pill)}
                      >
                        {platformIcons[post.platform]} {post.content.slice(0, 50)}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Side Panel */}
      {selectedDate && (
        <div className="hidden md:flex flex-col w-80 border-l border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selectedDayPosts.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <p>No posts scheduled</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-auto">
              {selectedDayPosts.map(post => {
                const colors = platformColors[post.platform]
                return (
                  <Card
                    key={post.id}
                    onClick={() => setEditingPost(post)}
                    className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded', colors.pill)}>
                        {platformIcons[post.platform]} {getAccountHandle(post.accountId)}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-3">{post.content}</p>
                    {post.scheduledAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(post.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          <Button
            className="mt-4 w-full"
            onClick={() => {
              setNewPost(prev => ({ ...prev, scheduledAt: selectedDate + 'T12:00:00' }))
              setCreatingPost(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Post
          </Button>
        </div>
      )}

      {/* Create Post Dialog */}
      <Dialog open={creatingPost} onOpenChange={setCreatingPost}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Account</Label>
              <Select value={newPost.accountId} onValueChange={v => setNewPost(p => ({ ...p, accountId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {config?.accounts.filter(a => a.enabled).map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {platformIcons[acc.platform]} {acc.handle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={newPost.content}
                onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                rows={4}
                placeholder="Write your post..."
              />
            </div>
            <div>
              <Label>Hashtags (comma separated)</Label>
              <Input
                value={newPost.hashtags}
                onChange={e => setNewPost(p => ({ ...p, hashtags: e.target.value }))}
                placeholder="#hashtag1, #hashtag2"
              />
            </div>
            <div>
              <Label>Schedule</Label>
              <Input
                type="datetime-local"
                value={newPost.scheduledAt?.slice(0, 16) || ''}
                onChange={e => setNewPost(p => ({ ...p, scheduledAt: e.target.value }))}
              />
            </div>
            <Button onClick={handleCreatePost} className="w-full">Create Post</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={open => { if (!open) setEditingPost(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs px-2 py-0.5 rounded', platformColors[editingPost.platform].pill)}>
                  {platformIcons[editingPost.platform]} {getAccountHandle(editingPost.accountId)}
                </span>
                <Badge variant="outline">{editingPost.status}</Badge>
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={editingPost.content}
                  onChange={e => setEditingPost(p => p ? { ...p, content: e.target.value } : null)}
                  rows={4}
                />
              </div>
              <div>
                <Label>Hashtags (comma separated)</Label>
                <Input
                  value={editingPost.hashtags.join(', ')}
                  onChange={e => setEditingPost(p => p ? { ...p, hashtags: e.target.value.split(/[,\s]+/).filter(Boolean) } : null)}
                />
              </div>
              <div>
                <Label>Schedule</Label>
                <Input
                  type="datetime-local"
                  value={editingPost.scheduledAt?.slice(0, 16) || ''}
                  onChange={e => setEditingPost(p => p ? { ...p, scheduledAt: e.target.value } : null)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} className="flex-1">Save</Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deletePost(editingPost.id)
                    setEditingPost(null)
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
