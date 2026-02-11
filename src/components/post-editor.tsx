'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Save,
  Send,
  Trash2,
  X,
  ImagePlus,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Post } from '@/lib/supabase'
import { PLATFORMS, STATUS_COLORS } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

type CCPhoto = {
  id: string
  uris: { type: string; uri: string }[]
  tags: { display_value: string }[]
  creator_name: string
  created_at: number
}

interface PostEditorProps {
  postId?: string
  initialContent?: string
  initialPlatforms?: string[]
  initialSchedule?: string
  initialPhotoUrls?: string[]
  initialStatus?: Post['status']
  initialTags?: string[]
  initialNotes?: string
}

export function PostEditor({
  postId,
  initialContent = '',
  initialPlatforms = [],
  initialSchedule = '',
  initialPhotoUrls = [],
  initialStatus = 'idea',
  initialTags = [],
  initialNotes = '',
}: PostEditorProps) {
  const router = useRouter()
  const [content, setContent] = useState(initialContent)
  const [platforms, setPlatforms] = useState<string[]>(initialPlatforms)
  const [scheduledAt, setScheduledAt] = useState(initialSchedule)
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialPhotoUrls)
  const [status, setStatus] = useState<Post['status']>(initialStatus)
  const [tags, setTags] = useState(initialTags.join(', '))
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Photo picker state
  const [recentPhotos, setRecentPhotos] = useState<CCPhoto[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'process.env.NEXT_PUBLIC_SUPABASE_URL',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      )
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error } = await supabase.storage.from('post-photos').upload(filename, file, {
        contentType: file.type,
        upsert: false,
      })
      if (error) {
        alert(`Upload failed: ${error.message}`)
        return
      }
      const { data: urlData } = supabase.storage.from('post-photos').getPublicUrl(filename)
      if (urlData?.publicUrl) {
        setPhotoUrls((prev) => [...prev, urlData.publicUrl])
      }
    } catch (err) {
      alert('Upload failed')
      console.error(err)
    } finally {
      setUploading(false)
      // Reset file input
      if (e.target) e.target.value = ''
    }
  }

  async function loadRecentPhotos() {
    if (recentPhotos.length > 0) return
    setPhotosLoading(true)
    try {
      const res = await fetch('/api/photos?per_page=30')
      if (res.ok) {
        const data = await res.json()
        setRecentPhotos(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Failed to load photos:', e)
    } finally {
      setPhotosLoading(false)
    }
  }

  function getPhotoUrl(photo: CCPhoto, size: string = 'web') {
    const uri = photo.uris.find((u) => u.type === size) || photo.uris[0]
    return uri?.uri || ''
  }

  function togglePlatform(platformId: string) {
    setPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    )
  }

  function addPhoto(url: string) {
    if (!photoUrls.includes(url)) {
      setPhotoUrls((prev) => [...prev, url])
    }
    setPhotoDialogOpen(false)
  }

  function removePhoto(url: string) {
    setPhotoUrls((prev) => prev.filter((u) => u !== url))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body = {
        content,
        platforms,
        scheduled_at: scheduledAt || null,
        photo_urls: photoUrls,
        status,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        notes: notes || null,
      }

      let res
      if (postId) {
        res = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

      if (res.ok) {
        const data = await res.json()
        if (!postId) {
          router.push(`/posts/${data.id}`)
        }
      } else {
        const err = await res.json()
        alert(`Save failed: ${err.error}`)
      }
    } catch {
      alert('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (status !== 'approved') {
      alert('Post must be approved before publishing')
      return
    }
    if (!postId) {
      alert('Save the post first')
      return
    }
    setPublishing(true)
    try {
      const res = await fetch(`/api/posts/${postId}/publish`, { method: 'POST' })
      const data = await res.json()
      
      if (res.ok) {
        setStatus('posted')
        const succeeded = data.summary?.succeeded || 0
        const failed = data.summary?.failed || 0
        alert(`Published! ${succeeded} platform(s) succeeded${failed > 0 ? `, ${failed} failed` : ''}`)
        router.refresh()
      } else {
        // Show validation errors if present
        if (data.validation?.summary && data.validation.summary.length > 0) {
          alert(`Publish failed:\n\n${data.validation.summary.join('\n')}`)
        } else {
          alert(`Publish failed: ${data.error || 'Unknown error'}`)
        }
      }
    } catch {
      alert('Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  async function handleDelete() {
    if (!postId) return
    if (!confirm('Delete this post?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/')
      } else {
        alert('Failed to delete')
      }
    } catch {
      alert('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {postId ? 'Edit Post' : 'New Post'}
        </h1>
        <div className="flex items-center gap-2">
          {postId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Delete
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
          {postId && status === 'approved' && (
            <Button
              className="bg-[#254421] hover:bg-[#1a3318] text-white"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Publish Now
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here..."
                className="min-h-[200px] resize-y"
              />
              <p className="text-xs text-gray-400 mt-2">
                {content.length} characters
                {content.length > 280 && (
                  <span className="text-yellow-600 ml-2">
                    (exceeds X/Twitter 280 limit)
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Photos</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => document.getElementById('photo-upload-input')?.click()}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ImagePlus className="w-4 h-4 mr-1" />}
                    Upload Photo
                  </Button>
                  <input
                    id="photo-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPhotoDialogOpen(true)
                        loadRecentPhotos()
                      }}
                    >
                      <ImagePlus className="w-4 h-4 mr-1" />
                      CompanyCam
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Select a Photo from CompanyCam</DialogTitle>
                    </DialogHeader>
                    {photosLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {recentPhotos.map((photo) => {
                          const thumbUrl = getPhotoUrl(photo, 'thumbnail')
                          const webUrl = getPhotoUrl(photo, 'web')
                          return (
                            <button
                              key={photo.id}
                              onClick={() => addPhoto(webUrl)}
                              className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square hover:ring-2 hover:ring-[#254421] transition-all"
                            >
                              <img
                                src={thumbUrl || webUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                  Select
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {photoUrls.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No photos attached. Click &quot;Add Photo&quot; to browse CompanyCam.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(url)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes (not published)..."
                className="min-h-[80px] resize-y"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={status} onValueChange={(v) => setStatus(v as Post['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="idea_approved">Needs Photos</SelectItem>
                  <SelectItem value="photo_review">Review Photos</SelectItem>
                  <SelectItem value="approved">Ready to Post</SelectItem>
                </SelectContent>
              </Select>
              {status && (
                <Badge className={`mt-2 ${STATUS_COLORS[status]}`}>
                  {status}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="datetime-local"
                value={scheduledAt ? scheduledAt.slice(0, 16) : ''}
                onChange={(e) => {
                  const val = e.target.value
                  setScheduledAt(val ? new Date(val).toISOString() : '')
                }}
              />
              {scheduledAt && (
                <p className="text-xs text-gray-500 mt-2">
                  {format(new Date(scheduledAt), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PLATFORMS.map((pl) => (
                  <label
                    key={pl.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={platforms.includes(pl.id)}
                      onChange={() => togglePlatform(pl.id)}
                      className="w-4 h-4 rounded border-gray-300 text-[#254421] focus:ring-[#254421]"
                    />
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${pl.color}`}
                    >
                      {pl.icon}
                    </span>
                    <span className="text-sm">{pl.name}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
              <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
