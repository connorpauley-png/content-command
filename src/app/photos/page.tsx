'use client'

import { useState, useEffect } from 'react'
import { Check, X, ArrowRight, Loader2, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Project {
  id: string
  name: string
  photo_count?: number
}

interface Photo {
  id: string
  uri: string
  captured_at: number
}

type Selection = 'before' | 'after' | null

export default function PhotosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selections, setSelections] = useState<Record<string, Selection>>({})
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/companycam/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function selectProject(project: Project) {
    setSelectedProject(project)
    setSelections({})
    setLoading(true)
    try {
      const res = await fetch(`/api/companycam/photos?project_id=${project.id}&limit=100`)
      const data = await res.json()
      // Map to expected format
      const mapped = (data.photos || []).map((p: any) => ({
        id: p.id,
        uri: p.url || p.thumbnail,
        captured_at: p.captured_at
      }))
      setPhotos(mapped)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function toggleSelection(photoId: string) {
    setSelections(prev => {
      const current = prev[photoId]
      if (current === null || current === undefined) {
        return { ...prev, [photoId]: 'before' }
      } else if (current === 'before') {
        return { ...prev, [photoId]: 'after' }
      } else {
        const copy = { ...prev }
        delete copy[photoId]
        return copy
      }
    })
  }

  function getBeforePhotos(): Photo[] {
    return photos.filter(p => selections[p.id] === 'before')
  }

  function getAfterPhotos(): Photo[] {
    return photos.filter(p => selections[p.id] === 'after')
  }

  async function createPost() {
    const beforePhotos = getBeforePhotos()
    const afterPhotos = getAfterPhotos()
    
    if (beforePhotos.length === 0 || afterPhotos.length === 0) {
      setMessage('Select at least one BEFORE and one AFTER photo')
      return
    }

    setCreating(true)
    setMessage('')

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Before and after.',
          platforms: ['instagram', 'facebook', 'nextdoor'],
          status: 'idea',
          photo_urls: [beforePhotos[0].uri, afterPhotos[0].uri],
          photo_source: 'companycam',
          ai_generated: false,
          tags: ['before-after', 'manual-selection'],
          notes: `Manual selection. Project: ${selectedProject?.name}`
        })
      })

      if (res.ok) {
        setMessage(`Post created! Before: ${beforePhotos.length} photo(s), After: ${afterPhotos.length} photo(s)`)
        setSelections({})
      } else {
        setMessage('Failed to create post')
      }
    } catch (e) {
      setMessage('Error creating post')
    }
    setCreating(false)
  }

  function clearSelections() {
    setSelections({})
  }

  const beforeCount = getBeforePhotos().length
  const afterCount = getAfterPhotos().length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Photo Picker</h1>
        <p className="text-gray-500 text-sm mt-1">
          Select before and after photos to create transformation posts
        </p>
      </div>

      {/* Project Selection */}
      {!selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Select a Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => selectProject(project)}
                    className="p-4 border rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                  >
                    <p className="font-medium truncate">{project.name}</p>
                    {project.photo_count && (
                      <p className="text-sm text-gray-500">{project.photo_count} photos</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Photo Selection */}
      {selectedProject && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setSelectedProject(null)}>
                Back
              </Button>
              <div>
                <h2 className="font-semibold">{selectedProject.name}</h2>
                <p className="text-sm text-gray-500">{photos.length} photos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Before: {beforeCount}
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                After: {afterCount}
              </Badge>
              {(beforeCount > 0 || afterCount > 0) && (
                <Button variant="ghost" size="sm" onClick={clearSelections}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <p><strong>Tap once</strong> = BEFORE (blue border)</p>
            <p><strong>Tap twice</strong> = AFTER (green border)</p>
            <p><strong>Tap three times</strong> = Deselect</p>
          </div>

          {/* Photo Grid */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {photos.map(photo => {
                const selection = selections[photo.id]
                return (
                  <button
                    key={photo.id}
                    onClick={() => toggleSelection(photo.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-4 transition-all ${
                      selection === 'before' 
                        ? 'border-blue-500 ring-2 ring-blue-300' 
                        : selection === 'after'
                        ? 'border-green-500 ring-2 ring-green-300'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={photo.uri} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                    {selection && (
                      <div className={`absolute top-1 right-1 px-2 py-0.5 rounded text-xs font-bold text-white ${
                        selection === 'before' ? 'bg-blue-500' : 'bg-green-500'
                      }`}>
                        {selection === 'before' ? 'BEFORE' : 'AFTER'}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Create Post Button */}
          {beforeCount > 0 && afterCount > 0 && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:static md:bg-transparent md:border-0 md:shadow-none">
              <Button 
                onClick={createPost} 
                disabled={creating}
                className="w-full md:w-auto bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Create Post ({beforeCount} before, {afterCount} after)
              </Button>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-lg ${message.includes('created') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}
        </>
      )}
    </div>
  )
}
