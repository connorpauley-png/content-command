import type { Publisher, NormalizedPost, ConnectedAccount, ValidationResult, PlatformPayload, PublishResult } from './core/types'
import { AuthError, RateLimitError } from './core/errors'

export const instagramPublisher: Publisher = {
  platform: 'instagram',

  async validate(post: NormalizedPost): Promise<ValidationResult> {
    const errors: string[] = []
    const images = post.media.filter(m => m.type === 'image')
    if (images.length === 0) errors.push('Instagram requires at least 1 image')
    // Check that URLs look public (basic check)
    for (const img of images) {
      if (!img.url.startsWith('http')) errors.push(`Invalid image URL: ${img.url}`)
    }
    return { valid: errors.length === 0, errors }
  },

  async preparePayload(post: NormalizedPost, account: ConnectedAccount): Promise<PlatformPayload> {
    const caption = post.variations?.instagram?.text || post.text
    const igAccountId = account.platformAccountId
    const token = account.accessToken
    const imageUrl = post.media[0].url

    return {
      platform: 'instagram',
      url: `https://graph.facebook.com/v21.0/${igAccountId}/media`,
      method: 'POST',
      body: { image_url: imageUrl, caption, access_token: token },
      headers: { 'Content-Type': 'application/json' },
    }
  },

  async publish(payload: PlatformPayload, account: ConnectedAccount): Promise<PublishResult> {
    const token = account.accessToken
    const igAccountId = account.platformAccountId

    // Step 1: Create container
    const createRes = await fetch(payload.url, {
      method: 'POST',
      headers: payload.headers,
      body: JSON.stringify(payload.body),
    })
    const createData = await createRes.json()

    if (createRes.status === 401 || createData.error?.code === 190) throw new AuthError('instagram')
    if (createRes.status === 429 || createData.error?.code === 4) throw new RateLimitError('instagram')
    if (createData.error) {
      return { success: false, platform: 'instagram', error: createData.error.message, rawResponse: createData }
    }

    // Step 2: Publish container
    const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: createData.id, access_token: token }),
    })
    const publishData = await publishRes.json()

    if (publishData.error) {
      return { success: false, platform: 'instagram', error: publishData.error.message, rawResponse: publishData }
    }

    return {
      success: true,
      platform: 'instagram',
      postId: publishData.id,
      postUrl: `https://instagram.com/p/${publishData.id}`,
      rawResponse: publishData,
    }
  },
}
