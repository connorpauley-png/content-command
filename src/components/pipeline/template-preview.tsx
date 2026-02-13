'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Paintbrush, Quote, ArrowLeftRight, Star, CheckSquare, Flame, Swords } from 'lucide-react'
import type { Post } from '@/types'
import { isTemplateRenderable } from '@/lib/content-types'

interface TemplatePreviewProps {
  post: Post
  onMediaAdded?: (url: string) => void
}

export function TemplatePreview({ post, onMediaAdded }: TemplatePreviewProps) {
  const [rendering, setRendering] = useState(false)

  if (!post.templateData || !isTemplateRenderable(post.contentType)) return null

  const td = post.templateData

  const handleRender = async () => {
    setRendering(true)
    try {
      const res = await fetch('/api/templates/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post }),
      })
      const data = await res.json()
      if (data.url) onMediaAdded?.(data.url)
    } catch (e) {
      console.error('Render failed:', e)
    } finally {
      setRendering(false)
    }
  }

  return (
    <div className="space-y-2">
      <Card className="p-3 bg-muted/50 text-xs space-y-1.5 overflow-hidden">
        {/* Quote Card */}
        {post.contentType === 'quote_card' && td.quote && (
          <div className="flex gap-2 items-start">
            <Quote className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <p className="italic line-clamp-2">&ldquo;{td.quote}&rdquo;</p>
              {td.author && <p className="text-muted-foreground mt-0.5">— {td.author}</p>}
            </div>
          </div>
        )}

        {/* Before/After */}
        {post.contentType === 'before_after' && (
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-purple-500 shrink-0" />
            <span>Before → After comparison</span>
          </div>
        )}

        {/* Testimonial */}
        {post.contentType === 'testimonial' && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {Array.from({ length: td.rating ?? 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            {td.quote && <p className="italic line-clamp-2">&ldquo;{td.quote}&rdquo;</p>}
            {td.author && <p className="text-muted-foreground">— {td.author}</p>}
          </div>
        )}

        {/* Stat Card */}
        {post.contentType === 'stat_card' && td.stat && (
          <div className="text-center">
            <div className="text-2xl font-bold">{td.stat}</div>
            {td.statLabel && <div className="text-muted-foreground">{td.statLabel}</div>}
          </div>
        )}

        {/* Checklist */}
        {post.contentType === 'checklist' && td.items && (
          <div className="space-y-0.5">
            {td.items.slice(0, 4).map((item, i) => (
              <div key={i} className="flex gap-1.5 items-center">
                <CheckSquare className="h-3 w-3 text-green-500" />
                <span className="line-clamp-1">{item}</span>
              </div>
            ))}
            {td.items.length > 4 && <span className="text-muted-foreground">+{td.items.length - 4} more</span>}
          </div>
        )}

        {/* Hot Take */}
        {post.contentType === 'hot_take' && td.headline && (
          <div className="flex gap-2 items-start">
            <Flame className="h-4 w-4 text-orange-500 shrink-0" />
            <p className="font-semibold line-clamp-2">{td.headline}</p>
          </div>
        )}

        {/* X vs Y */}
        {post.contentType === 'x_vs_y' && td.comparison && (
          <div className="flex items-center gap-2 justify-center">
            <span className="font-medium">{td.comparison.left}</span>
            <Swords className="h-4 w-4 text-purple-500" />
            <span className="font-medium">{td.comparison.right}</span>
          </div>
        )}

        {/* Fallback for other template types */}
        {td.headline && !['hot_take', 'quote_card'].includes(post.contentType ?? '') && (
          <p className="font-semibold line-clamp-2">{td.headline}</p>
        )}
        {td.subtext && <p className="text-muted-foreground line-clamp-1">{td.subtext}</p>}
      </Card>

      <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={handleRender} disabled={rendering}>
        {rendering ? <Loader2 className="h-3 w-3 animate-spin" /> : <Paintbrush className="h-3 w-3" />}
        {rendering ? 'Rendering…' : 'Render Graphic'}
      </Button>
    </div>
  )
}
