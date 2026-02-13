import type { Publisher, NormalizedPost, ConnectedAccount, ValidationResult, PlatformPayload, PublishResult } from './core/types'
import { AuthError, RateLimitError } from './core/errors'

export const facebookPublisher: Publisher = {
  platform: 'facebook',

  async validate(post: NormalizedPost): Promise<ValidationResult> {
    const errors: string[] = []
    const text = post.variations?.facebook?.text || post.text
    if (!text || text.trim().length === 0) errors.push('Text content is required')
    return { valid: errors.length === 0, errors }
  },

  async preparePayload(post: NormalizedPost, account: ConnectedAccount): Promise<PlatformPayload> {
    const text = post.variations?.facebook?.text || post.text
    const pageId = account.platformAccountId
    const token = account.accessToken
    const hasImages = post.media.some(m => m.type === 'image')

    if (hasImages) {
      return {
        platform: 'facebook',
        url: `https://graph.facebook.com/v21.0/${pageId}/photos`,
        method: 'POST',
        body: { url: post.media[0].url, message: text, access_token: token },
        headers: { 'Content-Type': 'application/json' },
      }
    }

    return {
      platform: 'facebook',
      url: `https://graph.facebook.com/v21.0/${pageId}/feed`,
      method: 'POST',
      body: { message: text, access_token: token },
      headers: { 'Content-Type': 'application/json' },
    }
  },

  async publish(payload: PlatformPayload): Promise<PublishResult> {
    const res = await fetch(payload.url, {
      method: 'POST',
      headers: payload.headers,
      body: JSON.stringify(payload.body),
    })

    const data = await res.json()

    if (res.status === 401 || data.error?.code === 190) throw new AuthError('facebook')
    if (res.status === 429 || data.error?.code === 4) throw new RateLimitError('facebook')

    if (data.error) {
      return { success: false, platform: 'facebook', error: data.error.message, rawResponse: data }
    }

    const id = data.id || data.post_id
    return {
      success: true,
      platform: 'facebook',
      postId: id,
      postUrl: `https://facebook.com/${id}`,
      rawResponse: data,
    }
  },
}
