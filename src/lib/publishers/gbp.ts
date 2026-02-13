import type { Publisher, NormalizedPost, ConnectedAccount, ValidationResult, PlatformPayload, PublishResult } from './core/types'

export const gbpPublisher: Publisher = {
  platform: 'google_business',

  async validate(): Promise<ValidationResult> {
    return { valid: true, errors: [] }
  },

  async preparePayload(post: NormalizedPost): Promise<PlatformPayload> {
    return { platform: 'google_business', url: '', body: { text: post.text } }
  },

  async publish(): Promise<PublishResult> {
    return { success: false, platform: 'google_business', error: 'GBP publishing not yet configured' }
  },
}
