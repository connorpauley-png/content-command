import type { ContentType } from '@/types'

export interface ContentTypeMeta {
  label: string
  icon: string // lucide icon name
  color: string // tailwind bg class
  textColor: string // tailwind text class
  description: string
  isTemplateType: boolean
  category: 'media' | 'graphic' | 'narrative' | 'video'
}

export const CONTENT_TYPE_META: Record<ContentType, ContentTypeMeta> = {
  // Media
  photo: { label: 'Photo', icon: 'Image', color: 'bg-blue-100', textColor: 'text-blue-700', description: 'Single photo post', isTemplateType: false, category: 'media' },
  carousel: { label: 'Carousel', icon: 'Images', color: 'bg-blue-100', textColor: 'text-blue-700', description: 'Multi-image carousel', isTemplateType: false, category: 'media' },
  story: { label: 'Story', icon: 'Circle', color: 'bg-blue-100', textColor: 'text-blue-700', description: '24-hour story', isTemplateType: false, category: 'media' },
  text: { label: 'Text', icon: 'Type', color: 'bg-blue-100', textColor: 'text-blue-700', description: 'Text-only post', isTemplateType: false, category: 'media' },

  // Graphics (template-rendered)
  quote_card: { label: 'Quote Card', icon: 'Quote', color: 'bg-purple-100', textColor: 'text-purple-700', description: 'Branded quote graphic', isTemplateType: true, category: 'graphic' },
  before_after: { label: 'Before/After', icon: 'ArrowLeftRight', color: 'bg-purple-100', textColor: 'text-purple-700', description: 'Before & after comparison', isTemplateType: true, category: 'graphic' },
  testimonial: { label: 'Testimonial', icon: 'Star', color: 'bg-purple-100', textColor: 'text-purple-700', description: 'Customer testimonial card', isTemplateType: true, category: 'graphic' },
  stat_card: { label: 'Stat Card', icon: 'BarChart3', color: 'bg-purple-100', textColor: 'text-purple-700', description: 'Key statistic highlight', isTemplateType: true, category: 'graphic' },
  flyer: { label: 'Flyer', icon: 'Megaphone', color: 'bg-purple-100', textColor: 'text-purple-700', description: 'Promotional flyer', isTemplateType: true, category: 'graphic' },
  checklist: { label: 'Checklist', icon: 'CheckSquare', color: 'bg-purple-100', textColor: 'text-purple-700', description: 'Checklist graphic', isTemplateType: true, category: 'graphic' },
  hot_take: { label: 'Hot Take', icon: 'Flame', color: 'bg-purple-100', textColor: 'text-purple-700', description: 'Bold opinion graphic', isTemplateType: true, category: 'graphic' },
  x_vs_y: { label: 'X vs Y', icon: 'Swords', color: 'bg-purple-100', textColor: 'text-purple-700', description: 'Comparison graphic', isTemplateType: true, category: 'graphic' },

  // Narrative
  origin_story: { label: 'Origin Story', icon: 'BookOpen', color: 'bg-amber-100', textColor: 'text-amber-700', description: 'Brand origin narrative', isTemplateType: false, category: 'narrative' },
  crew_spotlight: { label: 'Crew Spotlight', icon: 'Users', color: 'bg-amber-100', textColor: 'text-amber-700', description: 'Team member feature', isTemplateType: true, category: 'narrative' },
  day_in_life: { label: 'Day in the Life', icon: 'Sun', color: 'bg-amber-100', textColor: 'text-amber-700', description: 'Behind-the-scenes day', isTemplateType: false, category: 'narrative' },
  numbers_grid: { label: 'Numbers Grid', icon: 'Grid3x3', color: 'bg-purple-100', textColor: 'text-purple-700', description: 'Stats grid graphic', isTemplateType: true, category: 'graphic' },

  // Video
  video: { label: 'Video', icon: 'Video', color: 'bg-red-100', textColor: 'text-red-700', description: 'Video post', isTemplateType: false, category: 'video' },
  reel: { label: 'Reel', icon: 'Film', color: 'bg-red-100', textColor: 'text-red-700', description: 'Short-form reel', isTemplateType: false, category: 'video' },
  timelapse: { label: 'Timelapse', icon: 'Timer', color: 'bg-red-100', textColor: 'text-red-700', description: 'Timelapse video', isTemplateType: false, category: 'video' },
  tutorial: { label: 'Tutorial', icon: 'GraduationCap', color: 'bg-red-100', textColor: 'text-red-700', description: 'How-to tutorial', isTemplateType: false, category: 'video' },
  podcast_clip: { label: 'Podcast Clip', icon: 'Mic', color: 'bg-red-100', textColor: 'text-red-700', description: 'Audio/podcast clip', isTemplateType: false, category: 'video' },
}

const TEMPLATE_RENDERABLE: Set<string> = new Set([
  'quote_card', 'before_after', 'testimonial', 'stat_card',
  'flyer', 'checklist', 'hot_take', 'x_vs_y',
  'crew_spotlight', 'numbers_grid',
])

export function getContentTypeLabel(type?: ContentType | string): string {
  return CONTENT_TYPE_META[type as ContentType]?.label ?? 'Photo'
}

export function getContentTypeColor(type?: ContentType | string): string {
  return CONTENT_TYPE_META[type as ContentType]?.color ?? 'bg-blue-100'
}

export function getContentTypeTextColor(type?: ContentType | string): string {
  return CONTENT_TYPE_META[type as ContentType]?.textColor ?? 'text-blue-700'
}

export function getContentTypeIcon(type?: ContentType | string): string {
  return CONTENT_TYPE_META[type as ContentType]?.icon ?? 'Image'
}

export function isTemplateRenderable(type?: ContentType | string): boolean {
  return TEMPLATE_RENDERABLE.has(type ?? '')
}

export const CONTENT_TYPE_CATEGORIES: { category: string; label: string; types: ContentType[] }[] = [
  { category: 'media', label: 'Media', types: ['photo', 'carousel', 'story', 'text'] },
  { category: 'graphic', label: 'Graphics', types: ['quote_card', 'before_after', 'testimonial', 'stat_card', 'flyer', 'checklist', 'hot_take', 'x_vs_y', 'numbers_grid'] },
  { category: 'narrative', label: 'Narrative', types: ['origin_story', 'crew_spotlight', 'day_in_life'] },
  { category: 'video', label: 'Video', types: ['video', 'reel', 'timelapse', 'tutorial', 'podcast_clip'] },
]
