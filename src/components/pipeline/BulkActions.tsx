'use client'

import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import type { ColumnId } from './types'
import { COLUMNS } from './types'

interface BulkActionsProps {
  selectedCount: number
  onSelectAll: () => void
  onDeselectAll: () => void
  onBulkApprove: () => Promise<void>
  onBulkMove: (targetColumn: ColumnId) => Promise<void>
  loading: boolean
}

export function BulkActions({ selectedCount, onSelectAll, onDeselectAll, onBulkApprove, onBulkMove, loading }: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#254421] text-white rounded-full shadow-2xl px-4 py-2 flex items-center gap-3 animate-in slide-in-from-bottom-4">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="w-px h-5 bg-white/20" />
      <button
        onClick={onBulkApprove}
        disabled={loading}
        className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 min-h-[36px]"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        Approve All
      </button>
      <button
        onClick={onDeselectAll}
        className="text-sm text-white/70 hover:text-white px-2 py-1.5 min-h-[36px]"
      >
        Clear
      </button>
    </div>
  )
}
