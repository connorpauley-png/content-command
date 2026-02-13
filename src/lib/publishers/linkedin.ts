import type { Publisher, NormalizedPost, ConnectedAccount, ValidationResult, PlatformPayload, PublishResult } from './core/types'
import { AuthError, RateLimitError } from './core/errors'

export const linkedinPublisher: Publisher = {
  platform: 'linkedin',

  async validate(post: NormalizedPost): Promise<ValidationResult> {
    const errors: string[] = []
    const text = post.variations?.linkedin?.text || post.text
    if (text.length > 3000) errors.push(`Text too long: ${text.length}/3000 chars`)
    return { valid: errors.length === 0, errors }
  },

  async preparePayload(post: NormalizedPost, account: ConnectedAccount): Promise<PlatformPayload> {
    const text = post.variations?.linkedin?.text || post.text
    const accessToken = account.accessToken || process.env.LINKEDIN_ACCESS_TOKEN || ''
    const personUrn = account.metadata?.personUrn || process.env.LINKEDIN_PERSON_URN || ''
    const authorUrn = personUrn.startsWith('urn:') ? personUrn : `urn:li:person:${personUrn}`

    const body: Record<string, unknown> = {
      author: authorUrn,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
    }

    // Add image if present (requires pre-uploaded asset — for now text-only via Posts API)
    if (post.media.length > 0) {
      body.content = {
        media: {
          altText: text.slice(0, 100),
          id: post.media[0].url, // Assumes pre-registered asset URN
        },
      }
    }

    return {
      platform: 'linkedin',
      url: 'https://api.linkedin.com/rest/posts',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body,
    }
  },

  async publish(payload: PlatformPayload): Promise<PublishResult> {
    const res = await fetch(payload.url, {
      method: 'POST',
      headers: payload.headers,
      body: JSON.stringify(payload.body),
    })

    if (res.status === 401) throw new AuthError('linkedin')
    if (res.status === 429) throw new RateLimitError('linkedin')

    if (!res.ok) {
      return { success: false, platform: 'linkedin', error: `LinkedIn API ${res.status}: ${await res.text()}` }
    }

    const postId = res.headers.get('x-restli-id') || res.headers.get('x-linkedin-id') || 'unknown'
    return {
      success: true,
      platform: 'linkedin',
      postId,
      postUrl: `https://linkedin.com/feed/update/${postId}`,
    }
  },
}
