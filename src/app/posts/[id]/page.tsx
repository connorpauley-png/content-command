'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PostEditor } from '@/components/post-editor'
import type { Post } from '@/lib/supabase'

export default function EditPostPage() {
  const params = useParams()
  const id = params.id as string
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/posts/${id}`)
        if (res.ok) {
          setPost(await res.json())
        } else {
          setError('Post not found')
        }
      } catch {
        setError('Failed to load post')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">{error || 'Post not found'}</p>
      </div>
    )
  }

  return (
    <PostEditor
      postId={post.id}
      initialContent={post.content}
      initialPlatforms={post.platforms}
      initialSchedule={post.scheduled_at || ''}
      initialPhotoUrls={post.photo_urls || []}
      initialStatus={post.status}
      initialTags={post.tags || []}
      initialNotes={post.notes || ''}
    />
  )
}
