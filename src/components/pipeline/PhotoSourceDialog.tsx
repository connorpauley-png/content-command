'use client'

import { useState } from 'react'
import { Camera, Sparkles, Upload, Link as LinkIcon, X as XIcon, Loader2 } from 'lucide-react'
import type { Post } from '@/lib/supabase'

interface PhotoSourceDialogProps {
  post: Post
  onClose: () => void
  onAIGenerate: (post: Post) => void
  onCompanyCam: (post: Post) => void
  onUpload: (postId: string, files: FileList) => Promise<void>
  onPasteUrl: (postId: string, url: string) => Promise<void>
}

export function PhotoSourceDialog({ post, onClose, onAIGenerate, onCompanyCam, onUpload, onPasteUrl }: PhotoSourceDialogProps) {
  const [mode, setMode] = useState<'menu' | 'url' | 'upload'>('menu')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setLoading(true)
    try {
      await onUpload(post.id, e.target.files)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handlePasteUrl = async () => {
    if (!url.trim()) return
    setLoading(true)
    try {
      await onPasteUrl(post.id, url.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">How do you want to add photos?</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
            <XIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {mode === 'menu' && (
          <div className="p-4 space-y-2">
            <button
              onClick={() => { onAIGenerate(post); onClose() }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#e2b93b] hover:bg-[#e2b93b]/5 transition-all min-h-[56px]"
            >
              <div className="w-10 h-10 rounded-full bg-[#e2b93b]/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-[#e2b93b]" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">AI Generate (Astria)</p>
                <p className="text-xs text-gray-500">Create photos with AI face model</p>
              </div>
            </button>

            <button
              onClick={() => { onCompanyCam(post); onClose() }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-[#254421] hover:bg-[#254421]/5 transition-all min-h-[56px]"
            >
              <div className="w-10 h-10 rounded-full bg-[#254421]/10 flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5 text-[#254421]" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">CompanyCam</p>
                <p className="text-xs text-gray-500">Pick from job site photos</p>
              </div>
            </button>

            <button
              onClick={() => setMode('upload')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all min-h-[56px]"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Upload from device</p>
                <p className="text-xs text-gray-500">Choose photos from your phone or computer</p>
              </div>
            </button>

            <button
              onClick={() => setMode('url')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all min-h-[56px]"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <LinkIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">Paste URL</p>
                <p className="text-xs text-gray-500">Add a photo from any URL</p>
              </div>
            </button>
          </div>
        )}

        {mode === 'upload' && (
          <div className="p-6">
            <label className="block w-full p-8 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-[#254421] transition-colors">
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-[#254421] mx-auto" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Tap to select photos</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                </>
              )}
              <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
            </label>
            <button onClick={() => setMode('menu')} className="mt-3 text-sm text-gray-500 hover:text-gray-700">
              Back
            </button>
          </div>
        )}

        {mode === 'url' && (
          <div className="p-6 space-y-3">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-[#254421] focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setMode('menu')} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
                Back
              </button>
              <button
                onClick={handlePasteUrl}
                disabled={loading || !url.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#254421] rounded-lg hover:bg-[#1a3318] disabled:opacity-50 min-h-[44px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Photo'}
              </button>
            </div>
          </div>
        )}

        {/* Safe area for mobile */}
        <div className="h-6 md:hidden" />
      </div>
    </div>
  )
}
