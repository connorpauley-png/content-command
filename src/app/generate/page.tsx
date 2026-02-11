'use client'

import { useState, useEffect } from 'react'
import { Wand2, Image, Mic, FileText, Loader2, Check, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

interface Template {
  id: string
  name: string
  description: string
  type: string
  platforms: string[]
  settings: {
    minPhotos: number
    maxPhotos: number
    autoApproveEligible: boolean
  }
  variables: Array<{
    name: string
    type: string
    required: boolean
    default?: string | number
    options?: string[]
  }>
}

interface CompanyCamPhoto {
  id: string
  url: string
  project_id: string
  project_name?: string
}

export default function GeneratePage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<CompanyCamPhoto[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  // Custom content mode
  const [mode, setMode] = useState<'template' | 'custom' | 'photos'>('template')
  const [customContent, setCustomContent] = useState('')
  const [customPlatforms, setCustomPlatforms] = useState<string[]>(['instagram', 'facebook'])

  useEffect(() => {
    fetchTemplates()
    fetchRecentPhotos()
  }, [])

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/generate')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (e) {
      console.error('Failed to fetch templates:', e)
    }
  }

  async function fetchRecentPhotos() {
    setLoading(true)
    try {
      const res = await fetch('/api/companycam/photos?limit=20')
      const data = await res.json()
      setPhotos(data.photos || [])
    } catch (e) {
      console.error('Failed to fetch photos:', e)
    }
    setLoading(false)
  }

  function togglePhoto(url: string) {
    setSelectedPhotos(prev => 
      prev.includes(url) ? prev.filter(p => p !== url) : [...prev, url]
    )
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    setSuccess(false)

    try {
      let body: Record<string, unknown>

      if (mode === 'template' && selectedTemplate) {
        body = {
          action: 'from_template',
          templateId: selectedTemplate.id,
          variables,
          photoUrls: selectedPhotos,
        }
      } else if (mode === 'photos') {
        body = {
          action: 'from_photos',
          photoUrls: selectedPhotos,
        }
      } else {
        body = {
          action: 'bulk_from_ideas',
          ideas: [{
            content: customContent,
            platforms: customPlatforms,
            photoUrls: selectedPhotos,
          }],
        }
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.success) {
        setSuccess(true)
        setCustomContent('')
        setSelectedPhotos([])
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.error || 'Generation failed')
      }
    } catch (e) {
      setError('Generation failed')
    }

    setGenerating(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Content</h1>
          <p className="text-gray-500 text-sm mt-1">Create posts from templates, photos, or scratch</p>
        </div>
        <Link href="/approve">
          <Button variant="outline">
            Review Queue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        <Button 
          variant={mode === 'template' ? 'default' : 'outline'}
          onClick={() => setMode('template')}
        >
          <FileText className="w-4 h-4 mr-2" /> From Template
        </Button>
        <Button 
          variant={mode === 'photos' ? 'default' : 'outline'}
          onClick={() => setMode('photos')}
        >
          <Image className="w-4 h-4 mr-2" /> From Photos
        </Button>
        <Button 
          variant={mode === 'custom' ? 'default' : 'outline'}
          onClick={() => setMode('custom')}
        >
          <Wand2 className="w-4 h-4 mr-2" /> Custom
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template/Content selection */}
        <div className="lg:col-span-2 space-y-4">
          {mode === 'template' && (
            <Card>
              <CardHeader>
                <CardTitle>Select Template</CardTitle>
                <CardDescription>Pre-built formats that work</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template)
                      // Set default values
                      const defaults: Record<string, string> = {}
                      template.variables.forEach(v => {
                        if (v.default !== undefined) {
                          defaults[v.name] = String(v.default)
                        }
                      })
                      setVariables(defaults)
                    }}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {template.platforms.map(p => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                    {template.settings.autoApproveEligible && (
                      <Badge className="mt-2 bg-green-100 text-green-800 text-xs">Auto-approve eligible</Badge>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {mode === 'template' && selectedTemplate && selectedTemplate.variables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Template Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplate.variables.map(v => (
                  <div key={v.name}>
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {v.name.replace(/([A-Z])/g, ' $1')}
                      {v.required && <span className="text-red-500">*</span>}
                    </label>
                    {v.type === 'select' && v.options ? (
                      <Select 
                        value={variables[v.name] || ''} 
                        onValueChange={val => setVariables(prev => ({ ...prev, [v.name]: val }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={`Select ${v.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {v.options.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={v.type === 'number' ? 'number' : 'text'}
                        value={variables[v.name] || ''}
                        onChange={e => setVariables(prev => ({ ...prev, [v.name]: e.target.value }))}
                        className="mt-1"
                        placeholder={v.default !== undefined ? String(v.default) : ''}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {mode === 'custom' && (
            <Card>
              <CardHeader>
                <CardTitle>Write Your Post</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={customContent}
                  onChange={e => setCustomContent(e.target.value)}
                  placeholder="Write your post content here..."
                  className="min-h-[150px]"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700">Platforms</label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {['instagram', 'facebook', 'x', 'linkedin', 'nextdoor'].map(p => (
                      <button
                        key={p}
                        onClick={() => setCustomPlatforms(prev => 
                          prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                        )}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          customPlatforms.includes(p)
                            ? 'bg-green-100 border-green-500 text-green-800'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {mode === 'photos' && (
            <Card>
              <CardHeader>
                <CardTitle>Select Photos for Before/After</CardTitle>
                <CardDescription>Pick 2 photos from the same project</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Select photos below, or they will be auto-detected as before/after based on timestamp.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Photo picker */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>CompanyCam Photos</span>
                <Button variant="ghost" size="sm" onClick={fetchRecentPhotos} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                </Button>
              </CardTitle>
              <CardDescription>
                {selectedPhotos.length} selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                {photos.map(photo => (
                  <button
                    key={photo.id}
                    onClick={() => togglePhoto(photo.url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPhotos.includes(photo.url)
                        ? 'border-green-500 ring-2 ring-green-200'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {selectedPhotos.includes(photo.url) && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate button */}
          <Button 
            className="w-full h-12 text-lg"
            onClick={handleGenerate}
            disabled={generating || (mode === 'template' && !selectedTemplate) || (mode === 'custom' && !customContent)}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : success ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Created!
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Post
              </>
            )}
          </Button>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {success && (
            <Link href="/approve">
              <Button variant="outline" className="w-full">
                Review in Approval Queue
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
