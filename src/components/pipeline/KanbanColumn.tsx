'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Post } from '@/lib/supabase'
import type { ColumnId, ColumnDef, PipelineActions } from './types'
import { PostCard } from './PostCard'

interface KanbanColumnProps {
  column: ColumnDef
  posts: Post[]
  actions: PipelineActions
  updatingId: string | null
}

export function KanbanColumn({ column, posts, actions, updatingId }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className={`flex-shrink-0 w-full md:w-80 flex flex-col bg-gray-100 rounded-xl overflow-hidden transition-shadow ${
      isOver ? 'ring-2 ring-[#e2b93b] shadow-lg' : ''
    }`}>
      <div className="bg-[#254421] px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{column.label}</h3>
          <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {posts.length}
          </span>
        </div>
        <p className="text-xs text-white/70 mt-0.5">{column.description}</p>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[60vh] md:max-h-[60vh] min-h-[100px]"
      >
        <SortableContext items={posts.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              columnId={column.id}
              actions={actions}
              isUpdating={updatingId === post.id}
            />
          ))}
        </SortableContext>

        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <p className="text-xs">No posts</p>
          </div>
        )}
      </div>
    </div>
  )
}
