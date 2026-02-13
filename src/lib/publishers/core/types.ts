export interface Publisher {
  readonly platform: string
  validate(post: NormalizedPost, account: ConnectedAccount): Promise<ValidationResult>
  preparePayload(post: NormalizedPost, account: ConnectedAccount): Promise<PlatformPayload>
  publish(payload: PlatformPayload, account: ConnectedAccount): Promise<PublishResult>
  fetchMetrics?(platformPostId: string, account: ConnectedAccount): Promise<EngagementMetrics>
  refreshCredentials?(account: ConnectedAccount): Promise<ConnectedAccount>
}

export interface NormalizedPost {
  id: string
  text: string
  variations?: Record<string, { text?: string; hashtags?: string[]; mentions?: string[] }>
  media: MediaAsset[]
  scheduling: { publishAt: Date; timezone: string } | null
  metadata: { contentPillar?: string; generatedBy: 'ai' | 'manual'; sourceJobId?: string }
}

export interface MediaAsset {
  url: string
  type: 'image' | 'video'
  mimeType?: string
  width?: number
  height?: number
}

export interface ConnectedAccount {
  platform: string
  accountType: 'personal' | 'business_page'
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  platformAccountId: string
  metadata?: Record<string, string>
}

export interface ValidationResult { valid: boolean; errors: string[] }
export interface PlatformPayload { platform: string; body: any; headers?: Record<string, string>; url: string; method?: string }
export interface PublishResult { success: boolean; platform: string; postId?: string; postUrl?: string; error?: string; rawResponse?: any }
export interface EngagementMetrics { impressions: number; engagements: number; clicks: number; shares: number; comments: number; measuredAt: Date }
