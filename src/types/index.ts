export type Platform = 'instagram' | 'facebook' | 'linkedin' | 'twitter' | 'tiktok' | 'google_business' | 'nextdoor'

export type AIProvider = 'openai' | 'anthropic' | 'google'

export interface Client {
  id: string
  name: string
  industry: string
  description?: string
  createdAt: string
  updatedAt: string
  setupComplete: boolean
}

export type PostStatus = 'idea' | 'writing' | 'needs_photos' | 'approve_photos' | 'review' | 'scheduled' | 'posted' | 'failed'

export type BrandVoice = 'professional' | 'casual' | 'funny' | 'educational' | 'inspirational' | 'bold' | 'friendly'

export type AccountGoal = 'awareness' | 'leads' | 'personal_brand' | 'community' | 'sales' | 'education'

export type ContentType = 
  // Existing
  | 'photo' | 'video' | 'reel' | 'text' | 'story' | 'carousel'
  // Graphics (template-rendered)
  | 'quote_card' | 'before_after' | 'testimonial' | 'stat_card'
  | 'flyer' | 'checklist' | 'hot_take' | 'x_vs_y' | 'numbers_grid'
  // Narrative
  | 'origin_story' | 'crew_spotlight' | 'day_in_life'
  // Video
  | 'timelapse' | 'tutorial' | 'podcast_clip'

export interface BusinessConfig {
  name: string
  industry: string
  customIndustry?: string
  location: { city: string; state: string }
  services: string[]
  targetAudience: string
  brandVoice: BrandVoice[]
  usp: string
  contentRules: string[]
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string }
}

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  model?: string
}

export type AccountPersonality = 'business' | 'personal' | 'both'

export interface PlatformAccount {
  id: string
  platform: Platform
  enabled: boolean
  handle: string
  displayName: string
  credentials: Record<string, string>
  goal: AccountGoal
  personality: AccountPersonality
  contentTypes: ContentType[]
  postsPerWeek: number
  bestTimes: string[]
  hashtagStrategy: string
  voiceOverride?: BrandVoice[]
  contentDescription: string  // user describes what this account is FOR in their own words
  sampleTopics: string[]      // example topics they want to post about
  examplePosts: string[]      // real example posts to match voice/style
}

export interface ContentPillar {
  id: string
  name: string
  description: string
  examples: string[]
}

export interface ContentStrategy {
  document: string
  pillars: ContentPillar[]
  samplePosts: { accountId: string; content: string; pillar: string }[]
  calendar: CalendarSlot[]
}

export interface GoogleDriveConfig {
  enabled: boolean
  folderId?: string
  accessToken?: string
  refreshToken?: string
}

export interface IntegrationsConfig {
  companycam?: { apiToken: string }
  weather?: { location: string }
  googleDrive?: GoogleDriveConfig
  custom?: Record<string, string>
}

export interface CalendarSlot {
  dayOfWeek: number  // 0=Sun, 1=Mon, ..., 6=Sat
  accountId: string
  contentType: ContentType
  pillar?: string
  time: string  // "HH:MM"
}

export interface WeeklySchedule {
  slots: CalendarSlot[]
}

export interface AppConfig {
  clientId: string
  ai: AIConfig
  business: BusinessConfig
  accounts: PlatformAccount[]
  strategy?: ContentStrategy
  integrations?: IntegrationsConfig
  weeklySchedule?: WeeklySchedule
  setupComplete: boolean
  createdAt: string
  updatedAt: string
}

export interface TemplateData {
  template?: string
  headline?: string
  subtext?: string
  stat?: string
  statLabel?: string
  quote?: string
  author?: string
  rating?: number
  beforeImage?: string
  afterImage?: string
  items?: string[]  // for checklists
  comparison?: { left: string; right: string }  // for x_vs_y
  brandColors?: { primary?: string; accent?: string; background?: string; text?: string }
}

export interface Post {
  id: string
  clientId: string
  accountId: string
  platform: Platform
  contentType: ContentType  // defaults to 'photo' for backward compat
  status: PostStatus
  content: string
  mediaUrls: string[]
  hashtags: string[]
  templateData?: TemplateData
  assetNotes?: string
  imagePrompt?: string
  platformTips?: string
  assetType?: 'graphic_template' | 'ai_photo' | 'real_photo' | 'companycam' | 'video_clip' | 'no_media'
  scheduledAt?: string
  publishedAt?: string
  pillar?: string
  aiGenerated: boolean
  publishResult?: PublishResult
  publishStatus?: 'publishing' | 'verified' | 'failed'
  platformPostId?: string
  publishError?: string
  retryCount?: number
  createdAt: string
  updatedAt: string
}

export interface IndustryTemplate {
  id: string
  industry: string
  pillars: ContentPillar[]
  contentTypes: ContentType[]
  voiceSuggestions: BrandVoice[]
  weeklySchedule: CalendarSlot[]
  samplePosts: { contentType: ContentType; content: string }[]
}

export interface PublishResult {
  success: boolean
  platformPostId?: string
  url?: string
  error?: string
}

export interface PlatformRequirements {
  maxChars: number
  maxHashtags: number
  imageFormats: string[]
  maxImageSize: number // MB
  videoFormats: string[]
  maxVideoSize: number // MB
  maxImages: number
  supportsCarousel: boolean
  supportsStories: boolean
  supportsReels: boolean
}

export interface PlatformAdapter {
  name: Platform
  displayName: string
  icon: string
  color: string
  validateCredentials(credentials: Record<string, string>): Promise<boolean>
  publish(post: Post, credentials: Record<string, string>): Promise<PublishResult>
  getRequirements(): PlatformRequirements
  getCredentialFields(): { key: string; label: string; type: 'text' | 'password'; required: boolean }[]
}
