'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, Camera, FolderOpen, Link, Loader2, Check, X, ArrowLeft, Star, Zap, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePhotoJobStore } from '@/lib/store/photo-jobs'
import { useUsedPhotosStore } from '@/lib/store/used-photos'
import type { Post, AppConfig } from '@/types'

type PhotoSource = 'select' | 'ai' | 'companycam' | 'companycam-smart' | 'upload' | 'url'

interface CompanyCamPhoto {
  id: string
  uri: string
  thumbnail: string
  createdAt: string
  projectId?: string
}

interface CompanyCamProject {
  id: string
  name: string
}

interface ScoredPhoto {
  photoId: string
  url: string
  thumbnail: string
  score: number
  contentType: string
  serviceType: string
  description: string
  projectName: string
}

// Cache scored photos in memory for the session (localStorage cache for 24h)
const SCORE_CACHE_KEY = 'cc-scored-photos-cache'
const SCORE_CACHE_TTL = 24 * 60 * 60 * 1000

function getCachedScores(): ScoredPhoto[] | null {
  try {
    const raw = localStorage.getItem(SCORE_CACHE_KEY)
    if (!raw) return null
    const { photos, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > SCORE_CACHE_TTL) {
      localStorage.removeItem(SCORE_CACHE_KEY)
      return null
    }
    return photos
  } catch { return null }
}

function setCachedScores(photos: ScoredPhoto[]) {
  try {
    localStorage.setItem(SCORE_CACHE_KEY, JSON.stringify({ photos, timestamp: Date.now() }))
  } catch { /* ignore */ }
}

interface PhotoSourceDialogProps {
  open: boolean
  onClose: () => void
  post: Post
  config: AppConfig | null
  onPhotosSelected: (urls: string[]) => void
}

export function PhotoSourceDialog({ open, onClose, post, config, onPhotosSelected }: PhotoSourceDialogProps) {
  const [source, setSource] = useState<PhotoSource>('select')
  const [imagePrompt, setImagePrompt] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)
  const [numImages, setNumImages] = useState('4')
  const [error, setError] = useState<string | null>(null)
  const { startJob } = usePhotoJobStore()

  // CompanyCam state
  const [ccPhotos, setCcPhotos] = useState<CompanyCamPhoto[]>([])
  const [ccProjects, setCcProjects] = useState<CompanyCamProject[]>([])
  const [ccLoading, setCcLoading] = useState(false)
  const [ccProjectFilter, setCcProjectFilter] = useState('')
  const [ccSelected, setCcSelected] = useState<Set<string>>(new Set())

  // Smart CompanyCam state
  const [smartPhotos, setSmartPhotos] = useState<ScoredPhoto[]>([])
  const [smartLoading, setSmartLoading] = useState(false)
  const [smartError, setSmartError] = useState<string | null>(null)
  const { getUsedPhotos, addUsedPhoto } = useUsedPhotosStore()

  // Upload state
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([])

  // URL state
  const [urlInput, setUrlInput] = useState('')
  const [urlPreviews, setUrlPreviews] = useState<string[]>([])

  // Fetch smart scored photos
  const handleFetchSmartPhotos = useCallback(async (skipCache = false) => {
    setSmartLoading(true)
    setSmartError(null)
    try {
      // Check cache first (unless forced refresh)
      if (!skipCache) {
        const cached = getCachedScores()
        if (cached) {
          const usedIds = new Set(getUsedPhotos())
          const filtered = cached.filter(p => !usedIds.has(p.photoId)).slice(0, 5)
          if (filtered.length > 0) {
            setSmartPhotos(filtered)
            setSmartLoading(false)
            return
          }
        }
      } else {
        // Clear old cache
        try { localStorage.removeItem(SCORE_CACHE_KEY) } catch {}
      }

      const res = await fetch('/api/companycam/best', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usedPhotoIds: getUsedPhotos(),
          postContent: post.content,
          limit: 5,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setSmartError(data.error)
      } else {
        setSmartPhotos(data.photos || [])
        // Cache all scored photos
        if (data.photos) setCachedScores(data.photos)
      }
    } catch (e) {
      setSmartError(e instanceof Error ? e.message : 'Failed to fetch')
    }
    setSmartLoading(false)
  }, [getUsedPhotos, post.content])

  // Auto-generate image prompt when AI source is selected
  useEffect(() => {
    if (source === 'ai' && !imagePrompt && post.content && config?.ai) {
      setPromptLoading(true)
      const account = config.accounts.find(a => a.id === post.accountId)
      fetch('/api/generate/image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          accountPersonality: account?.personality || 'business',
          businessName: config.business.name,
          industry: config.business.industry,
          aiConfig: config.ai,
        }),
      })
        .then(r => r.json())
        .then(data => { if (data.prompt) setImagePrompt(data.prompt) })
        .catch(() => {})
        .finally(() => setPromptLoading(false))
    }
  }, [source, post.content, post.accountId, config, imagePrompt])

  const handleFetchCompanyCam = useCallback(async (projectId?: string) => {
    setCcLoading(true)
    try {
      const url = projectId ? `/api/companycam/photos?project_id=${projectId}` : '/api/companycam/photos'
      const res = await fetch(url)
      const data = await res.json()
      setCcPhotos(data.photos || [])
      if (data.projects) setCcProjects(data.projects)
    } catch { /* ignore */ }
    setCcLoading(false)
  }, [])

  useEffect(() => {
    if (source === 'companycam') handleFetchCompanyCam()
    if (source === 'companycam-smart') handleFetchSmartPhotos()
  }, [source, handleFetchCompanyCam, handleFetchSmartPhotos])

  const handleGenerateAndClose = async () => {
    setError(null)
    try {
      const res = await fetch('/api/astria/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt, numImages: parseInt(numImages) }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      if (data.promptId) {
        startJob(post.id, 'ai', data.promptId, imagePrompt)
        resetAndClose()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start generation')
    }
  }

  const handleSubmitAndClose = (urls: string[]) => {
    onPhotosSelected(urls)
    resetAndClose()
  }

  const resetAndClose = () => {
    setSource('select')
    setImagePrompt('')
    setCcPhotos([])
    setCcSelected(new Set())
    setSmartPhotos([])
    setSmartError(null)
    setUploadPreviews([])
    setUrlInput('')
    setUrlPreviews([])
    onClose()
  }

  const toggleCcSelection = (uri: string) => {
    const next = new Set(ccSelected)
    if (next.has(uri)) { next.delete(uri) } else { next.add(uri) }
    setCcSelected(next)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {source !== 'select' && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSource('select')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {source === 'select' ? 'How do you want to add photos?' :
             source === 'ai' ? 'AI Generate Photos' :
             source === 'companycam-smart' ? 'Best CompanyCam Photos' :
             source === 'companycam' ? 'CompanyCam Photos' :
             source === 'upload' ? 'Upload Photos' : 'Add Photo URLs'}
          </DialogTitle>
        </DialogHeader>

        {/* Source Selection */}
        {source === 'select' && (
          <div className="grid grid-cols-2 gap-3 py-2">
            {[
              { id: 'ai' as const, icon: Sparkles, title: 'AI Generate', desc: 'Generate photos with AI using your brand', color: 'border-violet-500/50 hover:border-violet-500 hover:bg-violet-500/5' },
              { id: 'companycam-smart' as const, icon: Zap, title: 'Smart Pick', desc: 'AI picks your best CompanyCam photos', color: 'border-yellow-500/50 hover:border-yellow-500 hover:bg-yellow-500/5' },
              { id: 'companycam' as const, icon: Camera, title: 'CompanyCam', desc: 'Browse all job site photos', color: 'border-blue-500/50 hover:border-blue-500 hover:bg-blue-500/5' },
              { id: 'upload' as const, icon: FolderOpen, title: 'Upload', desc: 'Upload from your device', color: 'border-green-500/50 hover:border-green-500 hover:bg-green-500/5' },
              { id: 'url' as const, icon: Link, title: 'Paste URL', desc: 'Paste image URLs', color: 'border-orange-500/50 hover:border-orange-500 hover:bg-orange-500/5' },
            ].map((opt) => (
              <button
                key={opt.id}
                className={cn(
                  'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all text-center',
                  opt.color
                )}
                onClick={() => setSource(opt.id)}
              >
                <opt.icon className="h-8 w-8" />
                <div>
                  <p className="font-semibold">{opt.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* AI Generate — just prompt + generate button, then closes */}
        {source === 'ai' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image Prompt</Label>
              {promptLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating prompt from your post...
                </div>
              ) : (
                <Textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={4}
                  placeholder="Describe the image you want to generate..."
                />
              )}
              <p className="text-xs text-muted-foreground">Auto-generated from your post content. Edit if needed.</p>
            </div>

            <div className="flex gap-2">
              <select
                className="h-10 px-3 rounded-md border border-input bg-background text-sm w-28"
                value={numImages}
                onChange={(e) => setNumImages(e.target.value)}
              >
                <option value="1">1 image</option>
                <option value="2">2 images</option>
                <option value="4">4 images</option>
              </select>
              <Button onClick={handleGenerateAndClose} disabled={!imagePrompt || promptLoading} className="flex-1">
                <Sparkles className="h-4 w-4 mr-2" /> Generate (runs in background)
              </Button>
            </div>
            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 rounded-lg p-3">{error}</div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Dialog will close. You can track progress on the card in the pipeline.
            </p>
          </div>
        )}

        {/* Smart CompanyCam — AI scored picks */}
        {source === 'companycam-smart' && (
          <div className="space-y-4">
            {smartLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
                <p className="text-sm text-muted-foreground">Scanning CompanyCam for best photos...</p>
                <p className="text-xs text-muted-foreground">AI is scoring your recent photos for social media appeal</p>
              </div>
            ) : smartError ? (
              <div className="text-sm text-red-500 bg-red-500/10 rounded-lg p-4 text-center">
                {smartError}
                <Button variant="outline" size="sm" className="mt-2 block mx-auto" onClick={() => handleFetchSmartPhotos(true)}>
                  Retry
                </Button>
              </div>
            ) : smartPhotos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No scored photos available</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => handleFetchSmartPhotos(true)}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Rescan Photos
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => handleFetchSmartPhotos(true)}>
                    <RefreshCw className="h-3 w-3 mr-1" /> Rescan
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                {smartPhotos.map((photo) => (
                  <button
                    key={photo.photoId}
                    className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-primary transition-all text-left group"
                    onClick={() => {
                      addUsedPhoto(photo.photoId, post.id)
                      handleSubmitAndClose([photo.url])
                    }}
                  >
                    <div className="relative h-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.thumbnail || photo.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        {photo.score}/10
                      </div>
                    </div>
                    <div className="p-2 space-y-1 bg-card">
                      <p className="text-xs font-medium truncate">{photo.projectName}</p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                          {photo.serviceType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600">
                          {photo.contentType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{photo.description}</p>
                    </div>
                  </button>
                ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CompanyCam — select and close */}
        {source === 'companycam' && (
          <div className="space-y-4">
            {ccProjects.length > 0 && (
              <select
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                value={ccProjectFilter}
                onChange={(e) => { setCcProjectFilter(e.target.value); handleFetchCompanyCam(e.target.value || undefined) }}
              >
                <option value="">All Projects</option>
                {ccProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}

            {ccLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : ccPhotos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No photos found</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                {ccPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    className={cn(
                      'relative rounded-lg overflow-hidden h-28 border-2 transition-all',
                      ccSelected.has(photo.uri) ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                    )}
                    onClick={() => toggleCcSelection(photo.uri)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumbnail || photo.uri} alt="" className="w-full h-full object-cover" />
                    {ccSelected.has(photo.uri) && (
                      <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {ccSelected.size > 0 && (
              <Button onClick={() => handleSubmitAndClose(Array.from(ccSelected))} className="w-full">
                Use {ccSelected.size} Photo{ccSelected.size !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        )}

        {/* Upload — select and close */}
        {source === 'upload' && (
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer">
              <FolderOpen className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to select images</p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files
                  if (!files) return
                  Array.from(files).forEach(file => {
                    const reader = new FileReader()
                    reader.onload = () => {
                      setUploadPreviews(prev => [...prev, reader.result as string])
                    }
                    reader.readAsDataURL(file)
                  })
                }}
              />
            </label>

            {uploadPreviews.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {uploadPreviews.map((url, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden h-28 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setUploadPreviews(prev => prev.filter((_, j) => j !== i))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button onClick={() => handleSubmitAndClose(uploadPreviews)} className="w-full">
                  Use {uploadPreviews.length} Photo{uploadPreviews.length !== 1 ? 's' : ''}
                </Button>
              </>
            )}
          </div>
        )}

        {/* URL — paste and close */}
        {source === 'url' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image URLs (one per line)</Label>
              <Textarea
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value)
                  setUrlPreviews(e.target.value.split('\n').map(u => u.trim()).filter(u => u.startsWith('http')))
                }}
                rows={4}
                placeholder={'https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg'}
              />
            </div>

            {urlPreviews.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {urlPreviews.map((url, i) => (
                    <div key={i} className="rounded-lg overflow-hidden h-28 bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  ))}
                </div>
                <Button onClick={() => handleSubmitAndClose(urlPreviews)} className="w-full">
                  Add {urlPreviews.length} Photo{urlPreviews.length !== 1 ? 's' : ''}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
