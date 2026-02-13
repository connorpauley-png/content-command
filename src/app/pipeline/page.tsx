'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useConfigStore, usePostsStore } from '@/lib/store/config'
import { useClientStore } from '@/lib/store/clients'
import { platformAdapters } from '@/lib/platforms'
import { Plus, GripVertical, Trash2, Sparkles, Filter, Trash, ImagePlus, FolderOpen, Camera, Loader2, CheckCircle, XCircle, Image, CalendarClock, RefreshCw, MousePointerClick, CheckSquare, Zap } from 'lucide-react'
import { usePhotoJobStore } from '@/lib/store/photo-jobs'
import { cn } from '@/lib/utils'
// PhotoSourceDialog kept for reference but replaced by AssetSourceDialog
// import { PhotoSourceDialog } from '@/components/pipeline/photo-source-dialog'
import { AssetSourceDialog } from '@/components/pipeline/asset-source-dialog'
import { PhotoApprovalDialog } from '@/components/pipeline/photo-approval-dialog'
import type { Post, PostStatus } from '@/types'
import { useAutoPublish } from '@/hooks/use-auto-publish'
import { Send } from 'lucide-react'

const columns: { id: PostStatus; label: string; color: string }[] = [
  { id: 'idea', label: '💡 Ideas', color: 'border-yellow-500/50' },
  { id: 'writing', label: '✍️ Writing', color: 'border-blue-500/50' },
  { id: 'needs_photos', label: '📷 Needs Assets', color: 'border-orange-500/50' },
  { id: 'approve_photos', label: '✅ Approve Photos', color: 'border-pink-500/50' },
  { id: 'review', label: '👀 Review', color: 'border-purple-500/50' },
  { id: 'scheduled', label: '📅 Scheduled', color: 'border-green-500/50' },
  { id: 'posted', label: '✅ Posted', color: 'border-emerald-500/50' },
]

function PublishStatusBadge({ post, onRetry }: { post: Post; onRetry?: () => void }) {
  if (post.status !== 'posted' || !post.publishStatus) return null

  if (post.publishStatus === 'publishing') {
    return (
      <div className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium bg-amber-500/10 text-amber-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Publishing...</span>
      </div>
    )
  }

  if (post.publishStatus === 'verified') {
    return (
      <div className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium bg-green-500/10 text-green-400">
        <CheckCircle className="h-3 w-3" />
        <span>Posted ✓</span>
      </div>
    )
  }

  if (post.publishStatus === 'failed') {
    return (
      <div className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium bg-red-500/10 text-red-400">
        <XCircle className="h-3 w-3" />
        <span className="flex-1 truncate">{post.publishError || 'Publish failed'}</span>
        {onRetry && (
          <button onClick={(e) => { e.stopPropagation(); onRetry() }} className="ml-1 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-semibold">
            Retry
          </button>
        )}
      </div>
    )
  }

  return null
}

function PostCard({ post, onClick, accountName, selectMode, selected, onToggleSelect, onRetryPublish, onPublishNow }: { post: Post; onClick: () => void; accountName: string; selectMode?: boolean; selected?: boolean; onToggleSelect?: () => void; onRetryPublish?: () => void; onPublishNow?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
    data: { type: 'post', post },
  })
  const adapter = platformAdapters[post.platform]
  const photoJob = usePhotoJobStore((s) => s.jobs[post.id])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={cn(
          "rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group overflow-hidden",
          selected ? "border-primary ring-2 ring-primary" : post.publishStatus === 'verified' ? "border-green-500/50" : post.publishStatus === 'failed' ? "border-red-500/50" : post.publishStatus === 'publishing' ? "border-amber-500/50" : "border-border"
        )}
        onClick={selectMode ? onToggleSelect : onClick}
      >
        {/* Publish status bar */}
        <PublishStatusBadge post={post} onRetry={onRetryPublish} />

        {/* Photo job status bar */}
        {photoJob && (
          <div className={cn(
            'px-3 py-1.5 flex items-center gap-2 text-xs font-medium',
            photoJob.status === 'generating' && 'bg-violet-500/10 text-violet-400',
            photoJob.status === 'ready' && 'bg-green-500/10 text-green-400',
            photoJob.status === 'failed' && 'bg-red-500/10 text-red-400',
          )}>
            {photoJob.status === 'generating' && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Generating photos...</span>
                <div className="flex-1 bg-muted rounded-full h-1.5 ml-1">
                  <div
                    className="bg-violet-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${photoJob.progress}%` }}
                  />
                </div>
              </>
            )}
            {photoJob.status === 'ready' && (
              <>
                <CheckCircle className="h-3 w-3" />
                <span>Photos ready — click to review</span>
              </>
            )}
            {photoJob.status === 'failed' && (
              <>
                <XCircle className="h-3 w-3" />
                <span>Generation failed — click to retry</span>
              </>
            )}
          </div>
        )}

        <div className="p-3">
          <div className="flex items-start gap-2">
            {selectMode ? (
              <div className="mt-1 flex-shrink-0">
                <div className={cn("h-4 w-4 rounded border-2 flex items-center justify-center transition-colors", selected ? "bg-primary border-primary" : "border-muted-foreground")}>
                  {selected && <CheckSquare className="h-3 w-3 text-primary-foreground" />}
                </div>
              </div>
            ) : (
              <button {...listeners} className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: adapter.color + '20', color: adapter.color }}
                >
                  {adapter.icon} {accountName}
                </span>
                {post.aiGenerated && <Sparkles className="h-3 w-3 text-primary" />}
                {post.mediaUrls.length > 0 && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Image className="h-3 w-3" /> {post.mediaUrls.length}
                  </span>
                )}
              </div>
              {post.mediaUrls.length > 0 && (
                <div className="mb-2 rounded overflow-hidden h-24 bg-muted flex gap-1">
                  {post.mediaUrls.slice(0, 3).map((url, i) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img key={i} src={url} alt="" className="flex-1 h-full object-cover" />
                  ))}
                  {post.mediaUrls.length > 3 && (
                    <div className="flex-1 h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{post.mediaUrls.length - 3}
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm line-clamp-2">{post.content || 'Untitled post'}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {post.contentType && post.contentType !== 'photo' && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {post.contentType.replace(/_/g, ' ')}
                  </Badge>
                )}
                {post.assetType && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-400 border-orange-400/30">
                    {post.assetType.replace(/_/g, ' ')}
                  </Badge>
                )}
                {post.pillar && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{post.pillar}</Badge>}
                {post.scheduledAt && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.scheduledAt).toLocaleDateString()} {new Date(post.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              {post.assetNotes && !post.mediaUrls?.length && (
                <p className="text-[10px] text-orange-400/70 mt-1 line-clamp-1">Asset: {post.assetNotes}</p>
              )}
              {onPublishNow && (post.status === 'review' || post.status === 'scheduled') && (
                <button
                  onClick={(e) => { e.stopPropagation(); onPublishNow() }}
                  className="mt-2 flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                >
                  <Send className="h-3 w-3" /> Publish Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Column({ id, label, color, posts, onAddPost, onClickPost, getAccountName, extraAction, selectMode, selectedIds, onToggleSelect, onSelectAllInColumn, onRetryPublish, onPublishNow }: {
  id: PostStatus; label: string; color: string; posts: Post[]
  onAddPost: () => void; onClickPost: (post: Post) => void; getAccountName: (post: Post) => string
  extraAction?: React.ReactNode
  selectMode?: boolean; selectedIds?: Set<string>; onToggleSelect?: (id: string) => void; onSelectAllInColumn?: () => void
  onRetryPublish?: (postId: string) => void
  onPublishNow?: (postId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'column' } })

  return (
    <div className="flex-1 min-w-[280px] max-w-[320px]">
      <div className={cn('rounded-lg border-t-2 bg-muted/30 h-full', color, isOver && 'bg-primary/5')}>
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{label}</span>
            <Badge variant="secondary" className="text-xs">{posts.length}</Badge>
          </div>
          <div className="flex items-center gap-1">
            {selectMode && posts.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onSelectAllInColumn}>
                Select All
              </Button>
            )}
            {extraAction}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddPost}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div ref={setNodeRef} className="p-2 space-y-2 min-h-[200px]">
          <SortableContext items={posts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={() => onClickPost(post)} accountName={getAccountName(post)} selectMode={selectMode} selected={selectedIds?.has(post.id)} onToggleSelect={() => onToggleSelect?.(post.id)} onRetryPublish={onRetryPublish ? () => onRetryPublish(post.id) : undefined} onPublishNow={onPublishNow ? () => onPublishNow(post.id) : undefined} />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const { currentClientId } = useClientStore()
  const { getConfig } = useConfigStore()
  const { getClientPosts, addPost, updatePost, deletePost, movePost } = usePostsStore()
  const config = getConfig()
  const posts = getClientPosts()
  const [mounted, setMounted] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [sortByDate, setSortByDate] = useState<boolean>(false)
  const [photoSourcePost, setPhotoSourcePost] = useState<Post | null>(null)
  const [photoApprovalPost, setPhotoApprovalPost] = useState<Post | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { jobs, startJob, updateProgress, completeJob, failJob } = usePhotoJobStore()
  const [fillingSchedule, setFillingSchedule] = useState(false)

  // Auto-publish scheduled posts that are due
  useAutoPublish()

  const publishPost = useCallback(async (postId: string) => {
    const post = usePostsStore.getState().posts.find(p => p.id === postId)
    if (!post || !config) return

    const account = config.accounts.find(a => a.id === post.accountId)
    if (!account) {
      updatePost(postId, { publishStatus: 'failed', publishError: 'Account not found' })
      return
    }

    updatePost(postId, { publishStatus: 'publishing', publishError: undefined })

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post, account }),
      })
      const data = await res.json()

      if (data.success) {
        updatePost(postId, {
          publishStatus: 'verified',
          platformPostId: data.platformPostId,
          publishedAt: new Date().toISOString(),
        })
      } else {
        updatePost(postId, { publishStatus: 'failed', publishError: data.error || 'Unknown error' })
      }
    } catch (err) {
      updatePost(postId, { publishStatus: 'failed', publishError: err instanceof Error ? err.message : 'Network error' })
    }
  }, [config, updatePost])

  useEffect(() => { setMounted(true) }, [])

  // Background poller for Astria photo generation jobs
  useEffect(() => {
    const activeJobs = Object.values(jobs).filter(j => j.status === 'generating' && j.promptId)
    if (activeJobs.length === 0) return

    const interval = setInterval(async () => {
      for (const job of activeJobs) {
        try {
          const res = await fetch(`/api/astria/status?promptId=${job.promptId}`)
          const data = await res.json()

          // Update progress based on time elapsed (Astria takes ~30-60s)
          const elapsed = (Date.now() - new Date(job.startedAt).getTime()) / 1000
          const estimatedProgress = Math.min(90, Math.round((elapsed / 50) * 100))
          updateProgress(job.postId, estimatedProgress)

          if (data.status === 'completed' && data.images?.length > 0) {
            // Attach images to the post and move to approve_photos
            updatePost(job.postId, { mediaUrls: data.images })
            movePost(job.postId, 'approve_photos')
            completeJob(job.postId)
          } else if (data.status === 'failed') {
            failJob(job.postId)
          }
        } catch { /* retry next interval */ }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [jobs, updateProgress, completeJob, failJob, updatePost, movePost])

  // Auto-attach graphic templates that land in needs_photos
  const autoAttachedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    const needsPhotos = posts.filter(
      (p) => p.status === 'needs_photos' && p.assetType === 'graphic_template' && p.templateData && !autoAttachedRef.current.has(p.id)
    )
    if (needsPhotos.length === 0) return

    for (const post of needsPhotos) {
      autoAttachedRef.current.add(post.id)
      fetch('/api/assets/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          source: 'template',
          templateData: post.templateData,
          templateName: post.templateData?.template,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.mediaUrls?.length) {
            updatePost(post.id, { mediaUrls: [...post.mediaUrls, ...data.mediaUrls] })
            movePost(post.id, 'review')
          }
        })
        .catch(() => { autoAttachedRef.current.delete(post.id) })
    }
  }, [posts, updatePost, movePost])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const filteredPosts = filterAccount === 'all'
    ? posts
    : posts.filter((p) => p.accountId === filterAccount)

  const getAccountName = (post: Post) => {
    const account = config?.accounts.find((a) => a.id === post.accountId)
    return account ? `@${account.handle}` : post.platform
  }

  const handleClearAll = () => {
    if (confirm('Clear ALL posts from the pipeline? This cannot be undone.')) {
      posts.forEach((p) => deletePost(p.id))
    }
  }

  const getColumnPosts = useCallback(
    (status: PostStatus) => {
      const columnPosts = filteredPosts.filter((p) => p.status === status)
      if (sortByDate) {
        return columnPosts.sort((a, b) => {
          if (!a.scheduledAt && !b.scheduledAt) return 0
          if (!a.scheduledAt) return 1
          if (!b.scheduledAt) return -1
          return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        })
      }
      return columnPosts
    },
    [filteredPosts, sortByDate]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const activePost = posts.find((p) => p.id === active.id)
    if (!activePost) return

    // Dropped on a column
    const overData = over.data.current
    if (overData?.type === 'column') {
      const newStatus = over.id as PostStatus
      movePost(activePost.id, newStatus)
      if (newStatus === 'needs_photos') {
        setPhotoSourcePost({ ...activePost, status: newStatus })
      }
      if (newStatus === 'posted') {
        publishPost(activePost.id)
      }
      return
    }

    // Dropped on another post
    const overPost = posts.find((p) => p.id === over.id)
    if (overPost && activePost.status !== overPost.status) {
      movePost(activePost.id, overPost.status)
      if (overPost.status === 'needs_photos') {
        setPhotoSourcePost({ ...activePost, status: overPost.status })
      }
      if (overPost.status === 'posted') {
        publishPost(activePost.id)
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activePost = posts.find((p) => p.id === active.id)
    if (!activePost) return

    // Check if over a column directly
    const isOverColumn = columns.some((c) => c.id === over.id)
    if (isOverColumn) {
      if (activePost.status !== over.id) {
        movePost(activePost.id, over.id as PostStatus)
      }
      return
    }

    // Over another post — move to that post's column
    const overPost = posts.find((p) => p.id === over.id)
    if (overPost && activePost.status !== overPost.status) {
      movePost(activePost.id, overPost.status)
    }
  }

  const handleAddPost = (status: PostStatus) => {
    if (!currentClientId) return
    
    const defaultPlatform = config?.accounts.find((a) => a.enabled)?.platform || 'instagram'
    const defaultAccountId = config?.accounts.find((a) => a.enabled)?.id || ''
    const now = new Date().toISOString()
    const newPost: Post = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clientId: currentClientId,
      accountId: defaultAccountId,
      platform: defaultPlatform,
      contentType: 'photo',
      status,
      content: '',
      mediaUrls: [],
      hashtags: [],
      aiGenerated: false,
      createdAt: now,
      updatedAt: now,
    }
    addPost(newPost)
    setEditingPost(newPost)
  }

  const handleResetSchedule = async () => {
    if (!config) return
    const scheduledPosts = posts.filter(p => p.status === 'scheduled' && p.scheduledAt)
    if (scheduledPosts.length === 0) return
    if (!confirm(`Reset dates on ${scheduledPosts.length} scheduled posts and re-fill?`)) return
    
    setFillingSchedule(true)
    // Clear all dates first
    for (const p of scheduledPosts) {
      updatePost(p.id, { scheduledAt: undefined })
    }
    // Small delay to let state update
    await new Promise(r => setTimeout(r, 100))
    // Now fill with fresh dates
    try {
      const clearedPosts = posts.map(p => 
        p.status === 'scheduled' ? { ...p, scheduledAt: undefined } : p
      )
      const res = await fetch('/api/schedule/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, posts: clearedPosts }),
      })
      const data = await res.json()
      if (data.updated) {
        for (const item of data.updated) {
          updatePost(item.id, { scheduledAt: item.scheduledAt })
        }
      }
    } catch { /* ignore */ }
    setFillingSchedule(false)
  }

  const handleFillSchedule = async () => {
    if (!config) return
    setFillingSchedule(true)
    try {
      const res = await fetch('/api/schedule/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, posts }),
      })
      const data = await res.json()
      if (data.updated) {
        for (const item of data.updated) {
          updatePost(item.id, { scheduledAt: item.scheduledAt })
        }
      }
    } catch (err) {
      console.error('Fill schedule failed:', err)
    } finally {
      setFillingSchedule(false)
    }
  }

  if (!mounted) return null
  
  if (!currentClientId || !config) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Client Selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select a client from the sidebar or create a new one to get started.
          </p>
          <Button asChild>
            <a href="/clients">Manage Clients</a>
          </Button>
        </div>
      </div>
    )
  }

  const activePost = activeId ? posts.find((p) => p.id === activeId) : null
  const enabledAccounts = config?.accounts.filter((a) => a.enabled) || []

  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Content Pipeline</h1>
          <p className="text-muted-foreground text-sm">{filteredPosts.length} posts{filterAccount !== 'all' ? ' (filtered)' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
            >
              <option value="all">All Accounts</option>
              {enabledAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {platformAdapters[a.platform].icon} @{a.handle} ({platformAdapters[a.platform].displayName})
                </option>
              ))}
            </select>
          </div>
          <Button
            variant={selectMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectMode(!selectMode)
              if (selectMode) setSelectedIds(new Set())
            }}
          >
            <MousePointerClick className="h-4 w-4 mr-1" /> {selectMode ? `Select (${selectedIds.size})` : 'Select'}
          </Button>
          {selectMode && selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
              <select
                className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                value=""
                onChange={(e) => {
                  const target = e.target.value as PostStatus
                  if (!target) return
                  selectedIds.forEach((id) => {
                    movePost(id, target)
                    if (target === 'posted') publishPost(id)
                  })
                  setSelectedIds(new Set())
                  setSelectMode(false)
                }}
              >
                <option value="">Move to →</option>
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
          <Button
            variant={sortByDate ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortByDate(!sortByDate)}
          >
            <CalendarClock className="h-4 w-4 mr-1" /> {sortByDate ? 'Sorted by Date' : 'Sort by Date'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              let moved = 0
              filteredPosts.forEach(post => {
                if (post.status !== 'idea') return
                const hasContent = post.content && !post.content.includes('[Concept:')
                if (!hasContent) return

                const hasMedia = post.mediaUrls?.length > 0

                if (hasMedia) {
                  movePost(post.id, 'review')
                  moved++
                  return
                }

                // Graphic templates auto-render — no manual asset needed
                if (post.assetType === 'graphic_template') {
                  movePost(post.id, 'review')
                  moved++
                  return
                }

                // Content that explicitly needs no media AND is pure text
                const textOnly = post.assetType === 'no_media' && 
                  ['text', 'hot_take'].includes(post.contentType)
                
                if (textOnly) {
                  movePost(post.id, 'review')
                  moved++
                  return
                }

                // Everything else needs assets — carousels, photos, reels,
                // before/afters, any post without media attached
                movePost(post.id, 'needs_photos')
                moved++
              })
              if (moved === 0) alert('Nothing to move — ideas need captions first')
            }}
          >
            <Zap className="h-4 w-4 mr-1" /> Auto-Move
          </Button>
          {posts.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleClearAll}>
              <Trash className="h-4 w-4 mr-1" /> Clear All
            </Button>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <Column
              key={col.id}
              {...col}
              posts={getColumnPosts(col.id)}
              onAddPost={() => handleAddPost(col.id)}
              onRetryPublish={col.id === 'posted' ? (postId) => publishPost(postId) : undefined}
              onPublishNow={(col.id === 'review' || col.id === 'scheduled') ? (postId) => publishPost(postId) : undefined}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={(id) => {
                setSelectedIds((prev) => {
                  const next = new Set(prev)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  return next
                })
              }}
              onSelectAllInColumn={() => {
                const colPosts = getColumnPosts(col.id)
                setSelectedIds((prev) => {
                  const next = new Set(prev)
                  const allSelected = colPosts.every((p) => next.has(p.id))
                  colPosts.forEach((p) => allSelected ? next.delete(p.id) : next.add(p.id))
                  return next
                })
              }}
              extraAction={col.id === 'scheduled' ? (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    disabled={fillingSchedule}
                    onClick={handleFillSchedule}
                  >
                    {fillingSchedule ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CalendarClock className="h-3 w-3" />
                    )}
                    Fill
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-orange-400 hover:text-orange-300"
                    disabled={fillingSchedule}
                    onClick={handleResetSchedule}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset
                  </Button>
                </div>
              ) : undefined}
              onClickPost={(post) => {
                if (post.status === 'approve_photos') {
                  setPhotoApprovalPost(post)
                } else if (post.status === 'needs_photos') {
                  setPhotoSourcePost(post)
                } else {
                  setEditingPost(post)
                }
              }}
              getAccountName={getAccountName}
            />
          ))}
        </div>

        <DragOverlay>
          {activePost && (
            <div className="p-3 rounded-lg border border-primary bg-card shadow-lg w-[280px]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{platformAdapters[activePost.platform].icon}</span>
              </div>
              <p className="text-sm line-clamp-2">{activePost.content || 'Untitled post'}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Asset Source Dialog */}
      {photoSourcePost && (
        <AssetSourceDialog
          open={!!photoSourcePost}
          onClose={() => setPhotoSourcePost(null)}
          post={photoSourcePost}
          config={config}
          onAttach={(urls, moveTo) => {
            if (urls.length > 0) {
              updatePost(photoSourcePost.id, { mediaUrls: [...photoSourcePost.mediaUrls, ...urls] })
            }
            movePost(photoSourcePost.id, moveTo)
            setPhotoSourcePost(null)
          }}
        />
      )}

      {/* Photo Approval Dialog */}
      {photoApprovalPost && (
        <PhotoApprovalDialog
          open={!!photoApprovalPost}
          onClose={() => setPhotoApprovalPost(null)}
          post={photoApprovalPost}
          onApprove={(approvedUrls) => {
            updatePost(photoApprovalPost.id, { mediaUrls: approvedUrls })
            movePost(photoApprovalPost.id, 'review')
            setPhotoApprovalPost(null)
          }}
          onRegenerate={() => {
            movePost(photoApprovalPost.id, 'needs_photos')
            const p = { ...photoApprovalPost, status: 'needs_photos' as const }
            setPhotoApprovalPost(null)
            setPhotoSourcePost(p)
          }}
          onGenerateMore={async (numImages) => {
            // Fire off another Astria batch and add results to existing photos
            const account = config?.accounts.find(a => a.id === photoApprovalPost.accountId)
            try {
              // Get image prompt from AI
              const promptRes = await fetch('/api/generate/image-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: photoApprovalPost.content,
                  accountPersonality: account?.personality || 'business',
                  businessName: config?.business.name,
                  industry: config?.business.industry,
                  aiConfig: config?.ai,
                }),
              })
              const promptData = await promptRes.json()

              // Start Astria generation
              const res = await fetch('/api/astria/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: promptData.prompt, numImages }),
              })
              const data = await res.json()
              if (data.promptId) {
                startJob(photoApprovalPost.id, 'ai', data.promptId, promptData.prompt)
                setPhotoApprovalPost(null)
              }
            } catch { /* handle error */ }
          }}
        />
      )}

      {/* Edit Post Dialog */}
      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={editingPost.accountId}
                    onChange={(e) => {
                      const account = config?.accounts.find((a) => a.id === e.target.value)
                      if (account) {
                        const updated = { ...editingPost, accountId: account.id, platform: account.platform }
                        setEditingPost(updated)
                        updatePost(editingPost.id, { accountId: account.id, platform: account.platform })
                      }
                    }}
                  >
                    {enabledAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {platformAdapters[a.platform].icon} {a.displayName || a.handle}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                    value={editingPost.status}
                    onChange={(e) => {
                      const status = e.target.value as PostStatus
                      setEditingPost({ ...editingPost, status })
                      movePost(editingPost.id, status)
                      if (status === 'needs_photos') {
                        setPhotoSourcePost({ ...editingPost, status })
                        setEditingPost(null)
                      }
                      if (status === 'posted') {
                        publishPost(editingPost.id)
                        setEditingPost(null)
                      }
                    }}
                  >
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editingPost.content}
                  onChange={(e) => {
                    setEditingPost({ ...editingPost, content: e.target.value })
                    updatePost(editingPost.id, { content: e.target.value })
                  }}
                  rows={5}
                  placeholder="Write your post content..."
                />
                <p className="text-xs text-muted-foreground text-right">
                  {editingPost.content.length} / {platformAdapters[editingPost.platform].getRequirements().maxChars}
                </p>
              </div>

              {/* Media / Photos */}
              <div className="space-y-2">
                <Label>Photos / Media</Label>
                {editingPost.mediaUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {editingPost.mediaUrls.map((url, i) => (
                      <div key={i} className="relative group rounded overflow-hidden h-24 bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const urls = editingPost.mediaUrls.filter((_, j) => j !== i)
                            setEditingPost({ ...editingPost, mediaUrls: urls })
                            updatePost(editingPost.id, { mediaUrls: urls })
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = prompt('Paste image URL:')
                      if (url) {
                        const urls = [...editingPost.mediaUrls, url]
                        setEditingPost({ ...editingPost, mediaUrls: urls })
                        updatePost(editingPost.id, { mediaUrls: urls })
                      }
                    }}
                  >
                    <ImagePlus className="h-4 w-4 mr-1" /> Add URL
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/companycam/photos')
                        if (res.ok) {
                          const data = await res.json()
                          if (data.photos?.length > 0) {
                            // Show first 10 photos to pick from
                            const photoUrl = prompt(
                              'CompanyCam photos available:\n' +
                              data.photos.slice(0, 10).map((p: { uri: string }, i: number) => `${i + 1}. ${p.uri}`).join('\n') +
                              '\n\nEnter number to select:'
                            )
                            if (photoUrl) {
                              const idx = parseInt(photoUrl) - 1
                              if (data.photos[idx]) {
                                const urls = [...editingPost.mediaUrls, data.photos[idx].uri]
                                setEditingPost({ ...editingPost, mediaUrls: urls })
                                updatePost(editingPost.id, { mediaUrls: urls })
                              }
                            }
                          } else {
                            alert('No CompanyCam photos found')
                          }
                        } else {
                          alert('CompanyCam not configured — add API key in Settings')
                        }
                      } catch {
                        alert('Failed to fetch CompanyCam photos')
                      }
                    }}
                  >
                    <Camera className="h-4 w-4 mr-1" /> CompanyCam
                  </Button>
                  <label>
                    <Button variant="outline" size="sm" asChild>
                      <span><FolderOpen className="h-4 w-4 mr-1" /> Upload</span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = e.target.files
                        if (!files) return
                        for (const file of Array.from(files)) {
                          const reader = new FileReader()
                          reader.onload = () => {
                            const dataUrl = reader.result as string
                            const urls = [...editingPost.mediaUrls, dataUrl]
                            setEditingPost((prev) => prev ? { ...prev, mediaUrls: urls } : prev)
                            updatePost(editingPost.id, { mediaUrls: urls })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hashtags (comma separated)</Label>
                <Input
                  value={editingPost.hashtags.join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map((t) => t.trim().replace('#', '')).filter(Boolean)
                    setEditingPost({ ...editingPost, hashtags: tags })
                    updatePost(editingPost.id, { hashtags: tags })
                  }}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="space-y-2">
                <Label>Schedule Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={editingPost.scheduledAt?.slice(0, 16) || ''}
                  onChange={(e) => {
                    const scheduledAt = e.target.value ? new Date(e.target.value).toISOString() : undefined
                    setEditingPost({ ...editingPost, scheduledAt })
                    updatePost(editingPost.id, { scheduledAt })
                  }}
                />
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deletePost(editingPost.id)
                    setEditingPost(null)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
                <Button size="sm" onClick={() => setEditingPost(null)}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
