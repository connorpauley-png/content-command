'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Check, X, ChevronLeft, ChevronRight, Edit2, Calendar, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

interface Post {
  id: string
  content: string
  platforms: string[]
  photo_urls: string[]
  status: string
  tags: string[]
  notes: string | null
  created_at: string
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📷',
  facebook: 'f',
  x: '𝕏',
  linkedin: 'in',
  nextdoor: 'N',
  gmb: 'G',
}

export default function ApprovePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)

  useEffect(() => {
    fetchPendingPosts()
  }, [])

  async function fetchPendingPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/posts?status=idea,idea_approved,photo_review')
      const data = await res.json()
      // API returns array directly
      setPosts(Array.isArray(data) ? data : data.posts || [])
    } catch (e) {
      console.error('Failed to fetch posts:', e)
    }
    setLoading(false)
  }

  const currentPost = posts[currentIndex]

  async function handleApprove() {
    if (!currentPost) return
    
    setSwipeDirection('right')
    
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentPost.id,
        status: 'approved',
      }),
    })
    
    setTimeout(() => {
      setSwipeDirection(null)
      goNext()
    }, 300)
  }

  async function handleReject() {
    if (!currentPost) return
    
    setSwipeDirection('left')
    
    await fetch('/api/posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentPost.id }),
    })
    
    setTimeout(() => {
      setSwipeDirection(null)
      setPosts(prev => prev.filter(p => p.id !== currentPost.id))
      if (currentIndex >= posts.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1))
      }
    }, 300)
  }

  async function handleEdit() {
    if (!currentPost || !editContent) return
    
    await fetch('/api/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentPost.id,
        content: editContent,
      }),
    })
    
    setPosts(prev => prev.map(p => 
      p.id === currentPost.id ? { ...p, content: editContent } : p
    ))
    setEditing(false)
  }

  function goNext() {
    if (currentIndex < posts.length - 1) {
      setCurrentIndex(i => i + 1)
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
    }
  }

  function handleDragEnd(_: any, info: PanInfo) {
    const threshold = 100
    if (info.offset.x > threshold) {
      handleApprove()
    } else if (info.offset.x < -threshold) {
      handleReject()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">All caught up!</h1>
        <p className="text-gray-400 mb-6">No posts waiting for approval</p>
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-gray-400">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        <span className="text-gray-400 text-sm">
          {currentIndex + 1} of {posts.length}
        </span>
        <div className="w-20" />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentPost && (
            <motion.div
              key={currentPost.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                x: swipeDirection === 'left' ? -300 : swipeDirection === 'right' ? 300 : 0,
                rotate: swipeDirection === 'left' ? -10 : swipeDirection === 'right' ? 10 : 0,
              }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              className="w-full max-w-md bg-gray-800 rounded-2xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
            >
              {/* Photo preview */}
              {currentPost.photo_urls?.length > 0 && (
                <div className="relative aspect-square bg-gray-900">
                  <img
                    src={currentPost.photo_urls[0]}
                    alt="Post preview"
                    className="w-full h-full object-cover"
                  />
                  {currentPost.photo_urls.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                      +{currentPost.photo_urls.length - 1} more
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Platforms */}
                <div className="flex gap-2 flex-wrap">
                  {currentPost.platforms.map(p => (
                    <Badge key={p} variant="secondary" className="text-xs">
                      {PLATFORM_ICONS[p] || p} {p}
                    </Badge>
                  ))}
                </div>

                {/* Caption */}
                {editing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleEdit}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                    {currentPost.content}
                  </p>
                )}

                {/* Tags */}
                {currentPost.tags?.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {currentPost.tags.map(t => (
                      <span key={t} className="text-xs text-gray-500">#{t}</span>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {currentPost.notes && (
                  <p className="text-xs text-gray-500 italic">{currentPost.notes}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Swipe hints */}
      <div className="flex justify-center gap-8 pb-4">
        <div className="text-red-400 text-sm flex items-center gap-1">
          <X className="w-4 h-4" /> Swipe left to reject
        </div>
        <div className="text-green-400 text-sm flex items-center gap-1">
          Swipe right to approve <Check className="w-4 h-4" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 flex items-center justify-center gap-4 border-t border-gray-800">
        <Button
          size="lg"
          variant="outline"
          className="rounded-full w-14 h-14 p-0 border-red-500 text-red-500 hover:bg-red-500/10"
          onClick={handleReject}
        >
          <X className="w-6 h-6" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-400"
          onClick={() => {
            setEditContent(currentPost?.content || '')
            setEditing(true)
          }}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          className="text-gray-400"
          onClick={() => {/* TODO: Schedule modal */}}
        >
          <Calendar className="w-4 h-4" />
        </Button>
        
        <Button
          size="lg"
          className="rounded-full w-14 h-14 p-0 bg-green-500 hover:bg-green-600"
          onClick={handleApprove}
        >
          <Check className="w-6 h-6" />
        </Button>
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-1 pb-4">
        {posts.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === currentIndex ? 'bg-white' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
