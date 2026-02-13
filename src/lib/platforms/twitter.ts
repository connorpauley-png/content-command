import type { PlatformAdapter, PlatformRequirements } from '@/types'

export const twitterAdapter: PlatformAdapter = {
  name: 'twitter',
  displayName: 'Twitter / X',
  icon: '𝕏',
  color: '#000000',

  async validateCredentials(credentials) {
    try {
      const res = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${credentials.bearerToken}` },
      })
      return res.ok
    } catch {
      return false
    }
  },

  async publish(post, credentials) {
    try {
      const text = post.hashtags.length > 0
        ? `${post.content}\n\n${post.hashtags.map((h) => `#${h}`).join(' ')}`
        : post.content

      // Twitter API v2 requires OAuth 1.0a for posting — simplified here
      const res = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.slice(0, 280) }),
      })
      const result = await res.json()

      if (result.data?.id) {
        return {
          success: true,
          platformPostId: result.data.id,
          url: `https://x.com/i/status/${result.data.id}`,
        }
      }
      return { success: false, error: result.detail || result.title || 'Failed to tweet' }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  },

  getRequirements(): PlatformRequirements {
    return {
      maxChars: 280,
      maxHashtags: 10,
      imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      maxImageSize: 5,
      videoFormats: ['mp4'],
      maxVideoSize: 512,
      maxImages: 4,
      supportsCarousel: false,
      supportsStories: false,
      supportsReels: false,
    }
  },

  getCredentialFields() {
    return [
      { key: 'bearerToken', label: 'Bearer Token', type: 'password' as const, required: true },
      { key: 'consumerKey', label: 'Consumer Key', type: 'text' as const, required: true },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password' as const, required: true },
      { key: 'accessToken', label: 'Access Token', type: 'text' as const, required: true },
      { key: 'accessTokenSecret', label: 'Access Token Secret', type: 'password' as const, required: true },
    ]
  },
}
