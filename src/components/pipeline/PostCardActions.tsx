'use client'

import {
  Send, Loader2, CheckCircle2, RotateCcw, ThumbsUp, ThumbsDown,
  Camera, Sparkles,
} from 'lucide-react'
import type { Post } from '@/lib/supabase'
import type { ColumnId, PipelineActions } from './types'
import { PLATFORM_PILL } from './types'

interface PostCardActionsProps {
  post: Post
  columnId: ColumnId
  actions: PipelineActions
  updating: boolean
}

export function PostCardActions({ post, columnId, actions, updating }: PostCardActionsProps) {
  const requiresPhotos = post.platforms?.some(p => p === 'instagram' || p === 'ig_personal') ?? false
  const needsAIPhotos = post.platforms?.some(p => PLATFORM_PILL[p]?.useAI) ?? false

  if (columnId === 'idea') {
    return (
      <div className="flex gap-2 mt-3">
        {requiresPhotos ? (
          <button
            onClick={() => actions.approveIdea(post.id)}
            disabled={updating}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-white bg-[#254421] rounded-lg hover:bg-[#1a3318] min-h-[44px]"
          >
            <ThumbsUp className="w-3.5 h-3.5" /> Add Photos
          </button>
        ) : (
          <>
            <button
              onClick={() => actions.approveTextOnly(post.id)}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-white bg-[#254421] rounded-lg hover:bg-[#1a3318] min-h-[44px]"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Text Only
            </button>
            <button
              onClick={() => actions.approveIdea(post.id)}
              disabled={updating}
              className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-semibold text-[#254421] bg-[#254421]/10 rounded-lg hover:bg-[#254421]/20 min-h-[44px]"
              title="Add photos anyway"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        <button
          onClick={() => actions.rejectIdea(post.id)}
          disabled={updating}
          className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 min-h-[44px]"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  if (columnId === 'photo_pending') {
    return (
      <div className="flex gap-2 mt-3">
        {needsAIPhotos ? (
          <button
            onClick={() => actions.openPhotoPrompt(post)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-white bg-[#e2b93b] rounded-lg hover:bg-[#c9a433] min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5" /> Generate AI Photo
          </button>
        ) : (
          <button
            onClick={() => actions.openCompanyCam(post)}
            className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-white bg-[#254421] rounded-lg hover:bg-[#1a3318] min-h-[44px]"
          >
            <Camera className="w-3.5 h-3.5" /> Add from CompanyCam
          </button>
        )}
      </div>
    )
  }

  if (columnId === 'generating') {
    return (
      <div className="flex items-center justify-center gap-2 py-3 text-xs text-[#e2b93b]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>AI generating photos...</span>
      </div>
    )
  }

  if (columnId === 'photo_review') {
    return (
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => actions.approvePhotos(post.id)}
          disabled={updating}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-white bg-[#254421] rounded-lg hover:bg-[#1a3318] min-h-[44px]"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
        </button>
        <button
          onClick={() => actions.rejectPhotos(post.id)}
          disabled={updating}
          className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 min-h-[44px]"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Redo
        </button>
      </div>
    )
  }

  if (columnId === 'approved') {
    return (
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => actions.publishPost(post.id)}
          disabled={updating}
          className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-semibold text-white bg-[#254421] rounded-lg hover:bg-[#1a3318] min-h-[44px]"
        >
          <Send className="w-3.5 h-3.5" /> Publish Now
        </button>
      </div>
    )
  }

  return null
}
