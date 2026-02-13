'use client'

import { Badge } from '@/components/ui/badge'
import { getContentTypeLabel, getContentTypeColor, getContentTypeTextColor, getContentTypeIcon } from '@/lib/content-types'
import type { ContentType } from '@/types'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ContentTypeBadgeProps {
  contentType?: ContentType | string
  size?: 'sm' | 'default'
  className?: string
}

function getIcon(name: string): LucideIcon {
  return (LucideIcons as unknown as Record<string, LucideIcon>)[name] ?? LucideIcons.Image
}

export function ContentTypeBadge({ contentType, size = 'sm', className = '' }: ContentTypeBadgeProps) {
  const type = contentType || 'photo'
  const label = getContentTypeLabel(type)
  const bgColor = getContentTypeColor(type)
  const textColor = getContentTypeTextColor(type)
  const Icon = getIcon(getContentTypeIcon(type))

  return (
    <Badge
      variant="secondary"
      className={`${bgColor} ${textColor} border-0 font-medium ${size === 'sm' ? 'text-[10px] px-1.5 py-0 gap-0.5' : 'text-xs px-2 py-0.5 gap-1'} ${className}`}
    >
      <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {label}
    </Badge>
  )
}
