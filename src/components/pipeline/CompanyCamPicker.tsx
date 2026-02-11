/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { Camera, CheckCircle2, Loader2, X as XIcon } from 'lucide-react'
import type { Post } from '@/lib/supabase'

interface CompanyCamPickerProps {
  post: Post
  onClose: () => void
  onSelect: (urls: string[]) => void
  saving: boolean
}

export function CompanyCamPicker({ post, onClose, onSelect, saving }: CompanyCamPickerProps) {
  const [photos, setPhotos] = useState<any[]>([])
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([])
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/companycam?limit=30' + (projectFilter ? `&project_id=${projectFilter}` : ''))
      .then(r => r.ok ? r.json() : { photos: [] })
      .then(d => setPhotos(d.photos || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [projectFilter])

  useEffect(() => {
    fetch('/api/companycam/projects')
      .then(r => r.ok ? r.json() : { projects: [] })
      .then(d => setProjects(d.projects || []))
      .catch(() => {})
  }, [])

  const toggle = (url: string) => {
    setSelected(prev => prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50">
      <div className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] md:max-h-[80vh] flex flex-col">
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#254421]/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#254421]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Select Photos from CompanyCam</h3>
                <p className="text-sm text-gray-500">Click to select, then confirm</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center">
              <XIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          {projects.length > 0 && (
            <select
              value={projectFilter}
              onChange={e => { setProjectFilter(e.target.value); setLoading(true) }}
              className="mt-3 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All Projects</option>
              {projects.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : photos.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No photos found</p>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {photos.map((photo: any) => (
                <button
                  key={photo.id}
                  onClick={() => toggle(photo.url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all min-h-[80px] ${
                    selected.includes(photo.url)
                      ? 'border-[#254421] ring-2 ring-[#254421]/30'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={photo.thumb || photo.url} alt="" className="w-full h-full object-cover" />
                  {selected.includes(photo.url) && (
                    <div className="absolute inset-0 bg-[#254421]/20 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {selected.length} photo{selected.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 min-h-[44px]">
              Cancel
            </button>
            <button
              onClick={() => onSelect(selected)}
              disabled={saving || selected.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#254421] rounded-lg hover:bg-[#1a3318] disabled:opacity-50 min-h-[44px]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Adding...' : 'Add Photos'}
            </button>
          </div>
        </div>
        <div className="h-6 md:hidden" />
      </div>
    </div>
  )
}
