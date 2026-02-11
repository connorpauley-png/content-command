'use client'

import { useState } from 'react'
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor,
  TouchSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { Post } from '@/lib/supabase'
import type { ColumnId, PipelineActions } from './types'
import { COLUMNS, groupPostsByColumn } from './types'
import { KanbanColumn } from './KanbanColumn'

// Map column IDs to the DB status values the API expects
const COLUMN_TO_STATUS: Record<ColumnId, string> = {
  idea: 'idea',
  photo_pending: 'idea_approved',
  generating: 'generating',
  photo_review: 'photo_review',
  approved: 'approved',
  posted: 'posted',
}

interface KanbanBoardProps {
  posts: Post[]
  actions: PipelineActions
  updatingId: string | null
  mobileTab: ColumnId
  onMobileTabChange: (tab: ColumnId) => void
}

export function KanbanBoard({ posts, actions, updatingId, mobileTab, onMobileTabChange }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const grouped = groupPostsByColumn(posts)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const postId = String(active.id)
    const targetColumn = String(over.id) as ColumnId

    // Only handle drops on columns (not cards)
    if (!COLUMNS.find(c => c.id === targetColumn)) return

    // Find current column
    const currentColumn = (Object.keys(grouped) as ColumnId[]).find(col =>
      grouped[col].some(p => p.id === postId)
    )
    if (!currentColumn || currentColumn === targetColumn) return

    const newStatus = COLUMN_TO_STATUS[targetColumn]
    if (newStatus) {
      actions.movePost(postId, newStatus)
    }
  }

  const activePost = activeId ? posts.find(p => p.id === activeId) : null

  return (
    <>
      {/* Mobile tab navigation */}
      <div className="md:hidden overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-1 min-w-max">
          {COLUMNS.map(col => (
            <button
              key={col.id}
              onClick={() => onMobileTabChange(col.id)}
              className={`text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap transition-all min-h-[40px] ${
                mobileTab === col.id
                  ? 'bg-[#254421] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {col.label}
              <span className="ml-1 opacity-70">({grouped[col.id].length})</span>
            </button>
          ))}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Desktop: horizontal scroll */}
        <div className="hidden md:flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 min-h-[calc(100vh-16rem)] snap-x snap-mandatory">
          {COLUMNS.map(col => (
            <div key={col.id} className="snap-start">
              <KanbanColumn
                column={col}
                posts={grouped[col.id]}
                actions={actions}
                updatingId={updatingId}
              />
            </div>
          ))}
        </div>

        {/* Mobile: single column view */}
        <div className="md:hidden pb-20">
          {COLUMNS.filter(c => c.id === mobileTab).map(col => (
            <KanbanColumn
              key={col.id}
              column={col}
              posts={grouped[col.id]}
              actions={actions}
              updatingId={updatingId}
            />
          ))}
        </div>

        <DragOverlay>
          {activePost && (
            <div className="bg-white rounded-lg shadow-xl border-2 border-[#e2b93b] p-3 w-80 opacity-90 rotate-2">
              <p className="text-sm text-gray-800 line-clamp-2">{activePost.content || 'No content'}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  )
}
