import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function validateEnvVars() {
  const missing: string[] = []
  if (!supabaseUrl || supabaseUrl === 'your-supabase-url' || supabaseUrl === 'https://your-project.supabase.co') {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!supabaseKey || supabaseKey === 'your-anon-key') {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(', ')}. ` +
      `Copy .env.example to .env.local and fill in your Supabase credentials. ` +
      `See README.md for setup instructions.`
    )
  }
}

validateEnvVars()

export const supabase = createClient(supabaseUrl, supabaseKey)

// Service role client for server-side operations
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
export const supabaseAdmin = createClient(supabaseUrl, serviceKey)

export type PostStatus = 'idea' | 'idea_approved' | 'generating' | 'photo_review' | 'approved' | 'posted' | 'partial' | 'failed'
export type PhotoSource = 'companycam' | 'generated' | 'manual' | null

export type Post = {
  id: string
  content: string
  platforms: string[]
  scheduled_at: string | null
  status: PostStatus
  photo_urls: string[]
  photo_source: PhotoSource
  ai_generated: boolean // true if photos are AI generated (requires approval)
  posted_ids: Record<string, string>
  tags: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

export type CalendarEvent = {
  id: string
  name: string
  event_date: string
  event_type: 'holiday' | 'local' | 'industry' | 'custom'
  description: string | null
  content_ideas: string[]
  created_at: string
}

export const PLATFORMS = [
  { id: 'x', name: 'X/Twitter', icon: '𝕏', color: 'bg-black text-white' },
  { id: 'facebook', name: 'Facebook', icon: 'f', color: 'bg-blue-600 text-white' },
  { id: 'instagram', name: 'Instagram (@collegebros31)', icon: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' },
  { id: 'ig_personal', name: 'Instagram (@connorpauleyski)', icon: '🎿', color: 'bg-gradient-to-r from-orange-500 to-pink-500 text-white' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: 'bg-blue-700 text-white' },
  { id: 'gmb', name: 'Google Business', icon: 'G', color: 'bg-green-600 text-white' },
  { id: 'nextdoor', name: 'Nextdoor', icon: 'N', color: 'bg-emerald-600 text-white' },
] as const

export const STATUS_COLORS = {
  idea: 'bg-purple-200 text-purple-800',
  idea_approved: 'bg-orange-200 text-orange-800',
  generating: 'bg-blue-200 text-blue-800',
  photo_review: 'bg-yellow-200 text-yellow-800',
  approved: 'bg-green-200 text-green-800',
  posted: 'bg-gray-200 text-gray-800',
  partial: 'bg-amber-200 text-amber-800',
  failed: 'bg-red-200 text-red-800',
} as const

export const STATUS_LABELS = {
  idea: '💡 Idea',
  idea_approved: '📸 Needs Photos',
  generating: '⏳ Generating',
  photo_review: '👀 Review Photos',
  approved: '✅ Ready to Post',
  posted: '📤 Posted',
  partial: '⚠️ Partial',
  failed: '❌ Failed',
} as const

// Platforms that use AI-generated images (personal brand)
export const AI_PHOTO_PLATFORMS = ['ig_personal', 'linkedin', 'x'] as const

// Platforms that use CompanyCam photos (business)
export const COMPANYCAM_PLATFORMS = ['instagram', 'facebook', 'gmb', 'nextdoor'] as const
