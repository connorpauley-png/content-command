'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Post } from '@/lib/supabase'
import type { ColumnId, PipelineActions } from './types'
import { PLATFORM_PILL } from './types'
import { PostCardActions } from './PostCardActions'

interface PostCardProps {
  post: Post
  columnId: ColumnId
  actions: PipelineActions
  isUpdating: boolean
}

export function PostCard({ post, columnId, actions, isUpdating }: PostCardProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: post.id, data: { columnId } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isUpdating ? 0.6 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden touch-manipulation cursor-grab active:cursor-grabbing"
    >
      <div className="p-3">
        {/* Photo preview */}
        {post.photo_urls && post.photo_urls.length > 0 && (
          <div className="mb-2 rounded overflow-hidden h-32 bg-gray-100 relative">
            <img src={post.photo_urls[0]} alt="" className="w-full h-full object-cover" />
            {post.photo_urls.length > 1 && (
              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                +{post.photo_urls.length - 1}
              </span>
            )}
            {(post as any).ai_generated && (
              <span className="absolute top-1 right-1 bg-[#e2b93b] text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <Link href={`/posts/${post.id}`}>
          <p className="text-sm text-gray-800 line-clamp-3 hover:text-[#254421] transition-colors">
            {post.content || 'No content'}
          </p>
        </Link>

        {/* Platforms */}
        <div className="flex flex-wrap gap-1 mt-2">
          {post.platforms?.map(pid => {
            const pill = PLATFORM_PILL[pid]
            return pill ? (
              <span key={pid} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${pill.activeClass}`}>
                {pill.label}
              </span>
            ) : null
          })}
        </div>

        {/* Actions */}
        <PostCardActions post={post} columnId={columnId} actions={actions} updating={isUpdating} />
      </div>
    </div>
  )
}
