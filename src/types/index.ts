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

export type ContentType = 'photo' | 'video' | 'reel' | 'text' | 'story' | 'carousel'

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
  calendar: { dayOfWeek: number; accountId: string; pillar: string; time: string }[]
}

export interface IntegrationsConfig {
  companycam?: { apiToken: string }
  weather?: { location: string }
  custom?: Record<string, string>
}

export interface AppConfig {
  clientId: string
  ai: AIConfig
  business: BusinessConfig
  accounts: PlatformAccount[]
  strategy?: ContentStrategy
  integrations?: IntegrationsConfig
  setupComplete: boolean
  createdAt: string
  updatedAt: string
}

export interface Post {
  id: string
  clientId: string
  accountId: string
  platform: Platform
  status: PostStatus
  content: string
  mediaUrls: string[]
  hashtags: string[]
  scheduledAt?: string
  publishedAt?: string
  pillar?: string
  aiGenerated: boolean
  publishResult?: PublishResult
  publishStatus?: 'publishing' | 'verified' | 'failed'
  platformPostId?: string
  publishError?: string
  createdAt: string
  updatedAt: string
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
