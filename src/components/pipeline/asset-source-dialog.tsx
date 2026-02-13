'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Check, X, Search, Wand2, Camera, Upload, ImagePlus, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePhotoJobStore } from '@/lib/store/photo-jobs'
import type { Post, AppConfig } from '@/types'

interface SearchPhoto {
  id: string
  url: string
  thumbnailUrl: string
  createdAt: string
  projectName: string
}

interface AssetSourceDialogProps {
  open: boolean
  onClose: () => void
  post: Post
  config: AppConfig | null
  onAttach: (urls: string[], moveTo: 'review' | 'approve_photos') => void
}

// Smart asset type detection based on content + platform
function detectAssetNeeds(post: Post): {
  primary: 'template' | 'companycam' | 'ai' | 'upload'
  recommendation: string
  allSources: ('template' | 'companycam' | 'ai' | 'upload')[]
} {
  const ct = post.contentType
  const at = post.assetType
  const platform = post.platform
  const content = post.content || ''

  // Graphic templates — auto-render
  if (at === 'graphic_template' || ['quote_card', 'stat_card', 'hot_take', 'numbers_grid', 'checklist', 'x_vs_y', 'flyer'].includes(ct)) {
    return {
      primary: 'template',
      recommendation: `This is a ${ct.replace(/_/g, ' ')} — can be auto-rendered as a graphic template.`,
      allSources: ['template', 'ai', 'upload'],
    }
  }

  // Before/after, crew spotlight — real photos from jobs
  if (['before_after', 'crew_spotlight'].includes(ct) || at === 'companycam') {
    return {
      primary: 'companycam',
      recommendation: `${ct.replace(/_/g, ' ')} posts work best with real job photos from CompanyCam.`,
      allSources: ['companycam', 'upload', 'ai'],
    }
  }

  // AI photo generation — personal brand, lifestyle
  if (at === 'ai_photo') {
    return {
      primary: 'ai',
      recommendation: 'AI-generated photo recommended for this post.',
      allSources: ['ai', 'companycam', 'upload'],
    }
  }

  // Carousels — need multiple images
  if (ct === 'carousel' || content.toLowerCase().includes('slide ')) {
    const slideCount = (content.match(/slide \d/gi) || []).length || 5
    return {
      primary: 'companycam',
      recommendation: `Carousel post — needs ~${slideCount} images. Pick from CompanyCam or generate.`,
      allSources: ['companycam', 'ai', 'template', 'upload'],
    }
  }

  // Instagram always needs visuals
  if (platform === 'instagram') {
    return {
      primary: 'companycam',
      recommendation: 'Instagram requires a photo or video. Real job photos perform best.',
      allSources: ['companycam', 'ai', 'upload'],
    }
  }

  // Video types
  if (['reel', 'video', 'timelapse', 'tutorial', 'day_in_life', 'podcast_clip'].includes(ct) || at === 'video_clip') {
    return {
      primary: 'upload',
      recommendation: `${ct.replace(/_/g, ' ')} needs video — upload from your device.`,
      allSources: ['upload', 'companycam'],
    }
  }

  // Default: suggest based on what looks right
  return {
    primary: 'companycam',
    recommendation: 'Add a photo to boost engagement.',
    allSources: ['companycam', 'ai', 'template', 'upload'],
  }
}

const SOURCE_META = {
  template: { label: 'Auto-Render', icon: Wand2, desc: 'Generate graphic from template' },
  companycam: { label: 'Job Photos', icon: Camera, desc: 'Pick from CompanyCam' },
  ai: { label: 'AI Generate', icon: ImagePlus, desc: 'Generate with Astria AI' },
  upload: { label: 'Upload', icon: Upload, desc: 'Upload files or paste URLs' },
} as const

export function AssetSourceDialog({ open, onClose, post, config, onAttach }: AssetSourceDialogProps) {
  const needs = detectAssetNeeds(post)
  const [activeSource, setActiveSource] = useState(needs.primary)
  const [showAllSources, setShowAllSources] = useState(false)

  // Template state
  const [templateRendering, setTemplateRendering] = useState(false)
  const [templateResult, setTemplateResult] = useState<string | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

  // CompanyCam state
  const [searchQuery, setSearchQuery] = useState(post.assetNotes || '')
  const [searchResults, setSearchResults] = useState<SearchPhoto[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Map<string, string>>(new Map())

  // AI state
  const [aiPrompt, setAiPrompt] = useState(post.imagePrompt || '')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const { startJob } = usePhotoJobStore()

  // Upload state
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([])
  const [urlInput, setUrlInput] = useState('')

  // Auto-load companycam photos on open
  useEffect(() => {
    if (open && (activeSource === 'companycam' || needs.primary === 'companycam')) {
      handleSearch(post.assetNotes || '')
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(async (query: string) => {
    setSearchLoading(true)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (query) params.set('q', query)
      const res = await fetch(`/api/assets/search?${params}`)
      const data = await res.json()
      setSearchResults(data.photos || [])
    } catch {
      setSearchResults([])
    }
    setSearchLoading(false)
  }, [])

  const togglePhoto = (photo: SearchPhoto) => {
    const next = new Map(selectedPhotos)
    if (next.has(photo.id)) {
      next.delete(photo.id)
    } else {
      next.set(photo.id, photo.url)
    }
    setSelectedPhotos(next)
  }

  const handleAutoRender = async () => {
    if (!post.templateData) {
      setTemplateError('No template data — try another source')
      return
    }
    setTemplateRendering(true)
    setTemplateError(null)
    try {
      const res = await fetch('/api/assets/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          source: 'template',
          templateData: post.templateData,
          templateName: post.templateData.template,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setTemplateError(data.error)
      } else if (data.mediaUrls?.length) {
        setTemplateResult(data.mediaUrls[0])
      }
    } catch (e) {
      setTemplateError(e instanceof Error ? e.message : 'Render failed')
    }
    setTemplateRendering(false)
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt) return
    setAiGenerating(true)
    setAiError(null)
    try {
      const res = await fetch('/api/assets/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, source: 'astria', prompt: aiPrompt }),
      })
      const data = await res.json()
      if (data.error) {
        setAiError(data.error)
      } else if (data.jobId) {
        startJob(post.id, 'ai', data.jobId, aiPrompt)
        onAttach([], 'approve_photos')
        resetAndClose()
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Generation failed')
    }
    setAiGenerating(false)
  }

  const handleAttach = () => {
    if (activeSource === 'template' && templateResult) {
      onAttach([templateResult], 'review')
    } else if (activeSource === 'companycam') {
      onAttach(Array.from(selectedPhotos.values()), 'review')
    } else if (activeSource === 'upload') {
      const urls = [...uploadPreviews]
      if (urlInput.trim()) {
        urls.push(...urlInput.split('\n').map(u => u.trim()).filter(u => u.startsWith('http')))
      }
      onAttach(urls, 'review')
    }
    resetAndClose()
  }

  const hasSelection = () => {
    if (activeSource === 'template') return !!templateResult
    if (activeSource === 'companycam') return selectedPhotos.size > 0
    if (activeSource === 'upload') return uploadPreviews.length > 0 || urlInput.trim().length > 0
    return false
  }

  const resetAndClose = () => {
    setSelectedPhotos(new Map())
    setSearchResults([])
    setSearchQuery(post.assetNotes || '')
    setUploadPreviews([])
    setUrlInput('')
    setAiPrompt(post.imagePrompt || '')
    setAiError(null)
    setTemplateError(null)
    setTemplateResult(null)
    setShowAllSources(false)
    onClose()
  }

  const otherSources = needs.allSources.filter(s => s !== activeSource)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Attach Assets
            <Badge variant="secondary" className="text-xs font-normal">
              {post.contentType?.replace(/_/g, ' ')}
            </Badge>
            {post.platform && (
              <Badge variant="outline" className="text-xs font-normal">
                {post.platform}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Smart recommendation */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 space-y-1">
          <p className="text-sm font-medium text-primary">{needs.recommendation}</p>
          {post.assetNotes && (
            <p className="text-xs text-muted-foreground">AI suggestion: {post.assetNotes}</p>
          )}
        </div>

        {/* Source selector */}
        <div className="flex flex-wrap gap-2">
          {[needs.primary, ...(showAllSources ? otherSources : [])].map((source) => {
            const meta = SOURCE_META[source]
            const Icon = meta.icon
            return (
              <button
                key={source}
                onClick={() => setActiveSource(source)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                  activeSource === source
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {meta.label}
              </button>
            )
          })}
          {!showAllSources && otherSources.length > 0 && (
            <button
              onClick={() => setShowAllSources(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="h-3 w-3" />
              {otherSources.length} more
            </button>
          )}
        </div>

        {/* Active source content */}
        <div className="min-h-[200px]">

          {/* TEMPLATE */}
          {activeSource === 'template' && (
            <div className="space-y-4">
              {post.templateData ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{post.templateData.template || 'auto'}</Badge>
                    <span className="text-xs text-muted-foreground">Template will be rendered as 1080x1080 PNG</span>
                  </div>
                  
                  {templateResult ? (
                    <div className="space-y-3">
                      <div className="rounded-lg overflow-hidden border max-w-[300px] mx-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={templateResult} alt="Rendered template" className="w-full" />
                      </div>
                      <p className="text-center text-sm text-green-500">Rendered successfully</p>
                    </div>
                  ) : (
                    <Button onClick={handleAutoRender} disabled={templateRendering} className="w-full" size="lg">
                      {templateRendering ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rendering...</>
                      ) : (
                        <><Wand2 className="h-4 w-4 mr-2" /> Render Template</>
                      )}
                    </Button>
                  )}

                  {templateError && (
                    <p className="text-sm text-red-500 bg-red-500/10 rounded-lg p-3">{templateError}</p>
                  )}
                </>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <p className="text-sm text-muted-foreground">No template data on this post.</p>
                  <p className="text-xs text-muted-foreground">The AI didn&apos;t generate template fields. Try another source or rebuild the post.</p>
                </div>
              )}
            </div>
          )}

          {/* COMPANYCAM */}
          {activeSource === 'companycam' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                    placeholder="Search job photos..."
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" onClick={() => handleSearch(searchQuery)} disabled={searchLoading}>
                  {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {selectedPhotos.size > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge>{selectedPhotos.size} selected</Badge>
                  <button onClick={() => setSelectedPhotos(new Map())} className="text-xs text-muted-foreground hover:text-foreground">
                    Clear
                  </button>
                </div>
              )}

              {searchLoading && searchResults.length === 0 ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-sm">No photos found. Try a different search.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-[350px] overflow-y-auto rounded-lg">
                  {searchResults.map((photo) => (
                    <button
                      key={photo.id}
                      className={cn(
                        'relative rounded-lg overflow-hidden h-28 border-2 transition-all',
                        selectedPhotos.has(photo.id) ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
                      )}
                      onClick={() => togglePhoto(photo)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.thumbnailUrl || photo.url} alt="" className="w-full h-full object-cover" />
                      {selectedPhotos.has(photo.id) && (
                        <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      {photo.projectName && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-white px-1.5 py-0.5 truncate">
                          {photo.projectName}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI GENERATE */}
          {activeSource === 'ai' && (
            <div className="space-y-4">
              {post.imagePrompt && (
                <div className="text-xs bg-muted rounded-lg p-3 space-y-1">
                  <span className="font-medium">AI-suggested prompt:</span>
                  <p>{post.imagePrompt}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Image Prompt</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  placeholder="Describe the image... keep it short and natural for best results"
                />
                <p className="text-[10px] text-muted-foreground">Tip: short casual prompts produce more natural results than over-specified ones</p>
              </div>
              {aiError && (
                <p className="text-sm text-red-500 bg-red-500/10 rounded-lg p-3">{aiError}</p>
              )}
              <Button onClick={handleAiGenerate} disabled={!aiPrompt || aiGenerating} className="w-full" size="lg">
                {aiGenerating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting generation...</>
                ) : (
                  <><ImagePlus className="h-4 w-4 mr-2" /> Generate with Astria (~$0.17)</>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">Generates in background. You&apos;ll approve the result before it attaches.</p>
            </div>
          )}

          {/* UPLOAD */}
          {activeSource === 'upload' && (
            <div className="space-y-4">
              <label className="flex flex-col items-center gap-2 p-8 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to select files</p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files
                    if (!files) return
                    Array.from(files).forEach(file => {
                      const reader = new FileReader()
                      reader.onload = () => setUploadPreviews(prev => [...prev, reader.result as string])
                      reader.readAsDataURL(file)
                    })
                  }}
                />
              </label>

              <div className="space-y-2">
                <Label>Or paste URLs (one per line)</Label>
                <Textarea
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  rows={2}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              {uploadPreviews.length > 0 && (
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
              )}
            </div>
          )}
        </div>

        {/* Bottom attach button */}
        {activeSource !== 'ai' && hasSelection() && (
          <Button onClick={handleAttach} size="lg" className="w-full">
            Attach {activeSource === 'companycam' ? `${selectedPhotos.size} photo${selectedPhotos.size > 1 ? 's' : ''}` : 'assets'} and Move to Review
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
