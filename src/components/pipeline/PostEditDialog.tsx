'use client'

import { useState } from 'react'
import { X as XIcon, Loader2, Save } from 'lucide-react'
import type { Post } from '@/lib/supabase'
import { PLATFORM_PILL, ALL_PLATFORM_IDS } from './types'

interface PostEditDialogProps {
  post: Post
  onClose: () => void
  onSave: (postId: string, data: { content: string; platforms: string[]; scheduled_at: string | null }) => Promise<void>
}

export function PostEditDialog({ post, onClose, onSave }: PostEditDialogProps) {
  const [content, setContent] = useState(post.content || '')
  const [platforms, setPlatforms] = useState<string[]>(post.platforms || [])
  const [scheduledAt, setScheduledAt] = useState(post.scheduled_at || '')
  const [saving, setSaving] = useState(false)

  const togglePlatform = (pid: string) => {
    setPlatforms(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(post.id, { content, platforms, scheduled_at: scheduledAt || null })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Edit Post</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#254421] focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">{content.length} characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORM_IDS.map(pid => {
                const pill = PLATFORM_PILL[pid]
                const active = platforms.includes(pid)
                return (
                  <button
                    key={pid}
                    onClick={() => togglePlatform(pid)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all min-h-[36px] ${
                      active ? `${pill.activeClass} border-transparent` : 'bg-white text-gray-400 border-gray-300'
                    }`}
                  >
                    {pill.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
            <input
              type="datetime-local"
              value={scheduledAt ? scheduledAt.slice(0, 16) : ''}
              onChange={e => setScheduledAt(e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#254421] focus:border-transparent min-h-[44px]"
            />
          </div>

          {/* Photo previews */}
          {post.photo_urls && post.photo_urls.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
              <div className="grid grid-cols-3 gap-2">
                {post.photo_urls.map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 min-h-[44px]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim() || platforms.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#254421] rounded-lg hover:bg-[#1a3318] disabled:opacity-50 min-h-[44px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
        <div className="h-6 md:hidden" />
      </div>
    </div>
  )
}
