/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Camera, Loader2, X as XIcon } from 'lucide-react'
import type { Post } from '@/lib/supabase'
import type { ColumnId, PipelineActions } from '@/components/pipeline/types'
import { KanbanBoard } from '@/components/pipeline/KanbanBoard'
import { PlatformFilter } from '@/components/pipeline/PlatformFilter'
import { AIPhotoModal } from '@/components/pipeline/AIPhotoModal'
import { CompanyCamPicker } from '@/components/pipeline/CompanyCamPicker'
import { MobileNav } from '@/components/pipeline/MobileNav'

// Toast component
function Toast({ message, type, onDismiss }: { message: string; type: 'error' | 'success' | 'warning'; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 4000); return () => clearTimeout(t) }, [onDismiss])
  const colors = { error: 'bg-red-600', success: 'bg-[#254421]', warning: 'bg-[#e2b93b]' }
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className={`flex items-center gap-2 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-md`}>
        <span>{message}</span>
        <button onClick={onDismiss} className="hover:text-white/70 shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [platformFilters, setPlatformFilters] = useState<string[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning' } | null>(null)
  const [photoPromptPost, setPhotoPromptPost] = useState<Post | null>(null)
  const [companyCamPost, setCompanyCamPost] = useState<Post | null>(null)
  const [generating, setGenerating] = useState(false)
  const [mobileTab, setMobileTab] = useState<ColumnId>('idea')

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/posts?limit=200')
      if (res.ok) { const data = await res.json(); setPosts(Array.isArray(data) ? data : []) }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => {
    const i = setInterval(() => {
      fetch('/api/posts?limit=200').then(r => r.ok ? r.json() : null).then(d => { if (Array.isArray(d)) setPosts(d) }).catch(() => {})
    }, 30000)
    return () => clearInterval(i)
  }, [])

  // Poll for generating posts
  const generatingIds = posts.filter(p => p.status === 'generating').map(p => p.id).join(',')
  useEffect(() => {
    if (!generatingIds) return
    const ids = generatingIds.split(',')
    const poll = setInterval(async () => {
      for (const id of ids) {
        try {
          const res = await fetch('/api/workflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_generation', postId: id }) })
          const data = await res.json()
          if (data.complete) { fetchPosts(); break }
        } catch { /* ignore */ }
      }
    }, 3000)
    return () => clearInterval(poll)
  }, [generatingIds, fetchPosts])

  const filteredPosts = platformFilters.length === 0 ? posts : posts.filter(p => p.platforms?.some(pid => platformFilters.includes(pid)))

  const notify = (message: string, type: 'success' | 'error' | 'warning') => setToast({ message, type })

  const actions: PipelineActions = {
    approveIdea: async (postId) => {
      setUpdating(postId)
      try {
        const res = await fetch('/api/workflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve_idea', postId }) })
        if (res.ok) { notify('Idea approved! Add photos next.', 'success'); fetchPosts() } else notify('Failed to approve idea', 'error')
      } catch { notify('Failed to approve idea', 'error') } finally { setUpdating(null) }
    },
    approveTextOnly: async (postId) => {
      setUpdating(postId)
      try {
        const res = await fetch('/api/workflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve_text_only', postId }) })
        if (res.ok) { const d = await res.json(); notify(`Approved as text-only!${d.note ? ` (${d.note})` : ''}`, 'success'); fetchPosts() }
        else { const d = await res.json(); notify(d.error || 'Failed to approve', 'error') }
      } catch { notify('Failed to approve', 'error') } finally { setUpdating(null) }
    },
    rejectIdea: async (postId) => {
      setUpdating(postId)
      try {
        const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
        if (res.ok) { notify('Idea rejected', 'warning'); fetchPosts() }
      } catch { notify('Failed to delete', 'error') } finally { setUpdating(null) }
    },
    openPhotoPrompt: (post) => setPhotoPromptPost(post),
    openCompanyCam: (post) => setCompanyCamPost(post),
    approvePhotos: async (postId) => {
      setUpdating(postId)
      try {
        const res = await fetch('/api/workflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve_photos', postId }) })
        if (res.ok) { notify('Approved! Ready to post.', 'success'); fetchPosts() }
      } catch { notify('Failed to approve', 'error') } finally { setUpdating(null) }
    },
    rejectPhotos: async (postId) => {
      setUpdating(postId)
      try {
        const res = await fetch('/api/workflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', postId }) })
        if (res.ok) { notify('Sent back to ideas', 'warning'); fetchPosts() }
      } catch { notify('Failed to reject', 'error') } finally { setUpdating(null) }
    },
    publishPost: async (postId) => {
      setUpdating(postId)
      try {
        const res = await fetch(`/api/posts/${postId}/publish`, { method: 'POST' })
        const data = await res.json()
        if (res.ok) {
          const s = data.summary?.succeeded || 0, f = data.summary?.failed || 0
          notify(`Published! ${s} platform(s) succeeded${f > 0 ? `, ${f} failed` : ''}`, 'success')
          fetchPosts()
        } else {
          const msg = data.validation?.summary?.length > 0 ? data.validation.summary.join(' | ') : data.error || 'Publish failed'
          notify(msg, 'error')
        }
      } catch { notify('Publish failed', 'error') } finally { setUpdating(null) }
    },
    movePost: async (postId, newStatus) => {
      setUpdating(postId)
      try {
        const res = await fetch('/api/workflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'move', postId, status: newStatus }) })
        if (res.ok) { notify('Post moved', 'success'); fetchPosts() } else notify('Failed to move post', 'error')
      } catch { notify('Failed to move post', 'error') } finally { setUpdating(null) }
    },
  }

  const handleGeneratePhotos = async (prompt: string) => {
    if (!photoPromptPost) return
    const postId = photoPromptPost.id
    setPhotoPromptPost(null)
    try {
      const res = await fetch('/api/workflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_photos', postId, prompt }) })
      if (res.ok) { notify('Generating photos... Will appear when ready.', 'success'); fetchPosts() }
      else { const d = await res.json(); notify(d.error || 'Generation failed', 'error') }
    } catch { notify('Generation failed', 'error') }
  }

  const handleCompanyCamSelect = async (urls: string[]) => {
    if (!companyCamPost) return
    setGenerating(true)
    try {
      const res = await fetch('/api/workflow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_photos', postId: companyCamPost.id, companycamPhotos: urls }) })
      if (res.ok) { notify('Photos added! Review them.', 'success'); setCompanyCamPost(null); fetchPosts() }
      else { const d = await res.json(); notify(d.error || 'Failed to add photos', 'error') }
    } catch { notify('Failed to add photos', 'error') } finally { setGenerating(false) }
  }

  return (
    <div className="space-y-4 pb-20 md:pb-4">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      {photoPromptPost && <AIPhotoModal post={photoPromptPost} onClose={() => setPhotoPromptPost(null)} onGenerate={handleGeneratePhotos} generating={generating} />}
      {companyCamPost && <CompanyCamPicker post={companyCamPost} onClose={() => setCompanyCamPost(null)} onSelect={handleCompanyCamSelect} saving={generating} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Content Pipeline</h1>
          <p className="text-gray-500 text-sm mt-1">Photos, Captions, Approval, Post</p>
        </div>
        <button onClick={fetchPosts} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 min-h-[44px]">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">Refresh</span>
        </button>
      </div>

      <PlatformFilter filters={platformFilters} onChange={setPlatformFilters} />
      <KanbanBoard posts={filteredPosts} actions={actions} updatingId={updating} mobileTab={mobileTab} onMobileTabChange={setMobileTab} />
      <MobileNav />
    </div>
  )
}
