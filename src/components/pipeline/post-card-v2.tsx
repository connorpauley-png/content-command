'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Copy, Paintbrush, GripVertical, Clock, Image as ImageIcon } from 'lucide-react'
import type { Post, PlatformAccount } from '@/types'
import { ContentTypeBadge } from './content-type-badge'
import { isTemplateRenderable } from '@/lib/content-types'
import { RepurposeDialog } from './repurpose-dialog'

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸', facebook: '📘', linkedin: '💼', twitter: '𝕏',
  tiktok: '🎵', google_business: '📍', nextdoor: '🏘️',
}

interface PostCardV2Props {
  post: Post
  account?: PlatformAccount
  onEdit?: (post: Post) => void
  onDelete?: (postId: string) => void
  onRenderGraphic?: (post: Post) => void
}

export function PostCardV2({ post, account, onEdit, onDelete, onRenderGraphic }: PostCardV2Props) {
  const [repurposeOpen, setRepurposeOpen] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: post.id,
    data: { type: 'post', post },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const scheduledTime = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null

  const thumbnail = post.mediaUrls?.[0]

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className="p-2.5 space-y-1.5 cursor-default group hover:shadow-md transition-shadow"
      >
        {/* Header: drag handle + platform + actions */}
        <div className="flex items-center gap-1.5">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground -ml-1">
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <span className="text-sm" title={account?.displayName ?? post.platform}>
            {PLATFORM_ICONS[post.platform] ?? '📱'}
          </span>
          <ContentTypeBadge contentType={post.contentType} />
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit?.(post)}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRepurposeOpen(true)}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Repurpose
              </DropdownMenuItem>
              {isTemplateRenderable(post.contentType) && (
                <DropdownMenuItem onClick={() => onRenderGraphic?.(post)}>
                  <Paintbrush className="h-3.5 w-3.5 mr-2" /> Render Graphic
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(post.id)}>
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content preview */}
        <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
          {post.content || <span className="text-muted-foreground italic">No content yet</span>}
        </p>

        {/* Media thumbnail */}
        {thumbnail && (
          <div className="relative h-20 rounded overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnail} alt="" className="w-full h-full object-cover" />
            {post.mediaUrls.length > 1 && (
              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">
                <ImageIcon className="h-2.5 w-2.5 inline mr-0.5" />
                {post.mediaUrls.length}
              </span>
            )}
          </div>
        )}

        {/* Footer: schedule time + pillar */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {scheduledTime && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" /> {scheduledTime}
            </span>
          )}
          {post.pillar && (
            <span className="truncate">#{post.pillar}</span>
          )}
        </div>
      </Card>

      <RepurposeDialog post={post} open={repurposeOpen} onOpenChange={setRepurposeOpen} />
    </>
  )
}
