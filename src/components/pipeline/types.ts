import type { Post } from '@/lib/supabase'

export type ColumnId = 'idea' | 'photo_pending' | 'generating' | 'photo_review' | 'approved' | 'posted'

export interface ColumnDef {
  id: ColumnId
  label: string
  description: string
}

export const COLUMNS: ColumnDef[] = [
  { id: 'idea', label: 'Ideas', description: 'Caption concepts' },
  { id: 'photo_pending', label: 'Needs Photos', description: 'Approved ideas awaiting photos' },
  { id: 'generating', label: 'Generating', description: 'AI creating photos' },
  { id: 'photo_review', label: 'Review Photos', description: 'Photos added, needs approval' },
  { id: 'approved', label: 'Ready to Post', description: 'Approved and ready' },
  { id: 'posted', label: 'Posted', description: 'Published' },
]

export const PLATFORM_PILL: Record<string, { label: string; activeClass: string; inactiveClass: string; useAI?: boolean }> = {
  x: { label: 'X', activeClass: 'bg-black text-white', inactiveClass: 'bg-gray-200 text-gray-400', useAI: true },
  facebook: { label: 'FB', activeClass: 'bg-blue-600 text-white', inactiveClass: 'bg-gray-200 text-gray-400' },
  instagram: { label: 'IG', activeClass: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white', inactiveClass: 'bg-gray-200 text-gray-400' },
  linkedin: { label: 'Li', activeClass: 'bg-blue-700 text-white', inactiveClass: 'bg-gray-200 text-gray-400', useAI: true },
  ig_personal: { label: 'IG-P', activeClass: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white', inactiveClass: 'bg-gray-200 text-gray-400', useAI: true },
  gmb: { label: 'GMB', activeClass: 'bg-green-600 text-white', inactiveClass: 'bg-gray-200 text-gray-400' },
  nextdoor: { label: 'ND', activeClass: 'bg-emerald-600 text-white', inactiveClass: 'bg-gray-200 text-gray-400' },
}

export const ALL_PLATFORM_IDS = Object.keys(PLATFORM_PILL)

export type PostAction = 'approve_idea' | 'approve_text_only' | 'reject' | 'generate_ai' | 'add_companycam' | 'approve_photos' | 'reject_photos' | 'publish'

export interface PipelineActions {
  approveIdea: (postId: string) => Promise<void>
  approveTextOnly: (postId: string) => Promise<void>
  rejectIdea: (postId: string) => Promise<void>
  openPhotoPrompt: (post: Post) => void
  openCompanyCam: (post: Post) => void
  approvePhotos: (postId: string) => Promise<void>
  rejectPhotos: (postId: string) => Promise<void>
  publishPost: (postId: string) => Promise<void>
  movePost: (postId: string, newStatus: string) => Promise<void>
}

export function groupPostsByColumn(posts: Post[]): Record<ColumnId, Post[]> {
  const grouped: Record<ColumnId, Post[]> = {
    idea: [], photo_pending: [], generating: [], photo_review: [], approved: [], posted: [],
  }
  for (const post of posts) {
    const s = post.status as string
    if (s === 'idea') grouped.idea.push(post)
    else if (s === 'idea_approved') grouped.photo_pending.push(post)
    else if (s === 'generating') grouped.generating.push(post)
    else if (s === 'photo_review') grouped.photo_review.push(post)
    else if (s === 'approved') grouped.approved.push(post)
    else if (s === 'posted') grouped.posted.push(post)
    else if (s === 'failed') grouped.approved.push(post)
  }
  return grouped
}
