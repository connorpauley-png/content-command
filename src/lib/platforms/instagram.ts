import type { PlatformAdapter, PlatformRequirements } from '@/types'

export const instagramAdapter: PlatformAdapter = {
  name: 'instagram',
  displayName: 'Instagram',
  icon: '📸',
  color: '#E4405F',

  async validateCredentials(credentials) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.accountId}?fields=id,username&access_token=${credentials.accessToken}`
      )
      return res.ok
    } catch {
      return false
    }
  },

  async publish(post, credentials) {
    try {
      // Step 1: Create media container
      const containerParams: Record<string, string> = {
        access_token: credentials.accessToken,
        caption: `${post.content}\n\n${post.hashtags.map((h) => `#${h}`).join(' ')}`,
      }

      if (post.mediaUrls.length > 0) {
        containerParams.image_url = post.mediaUrls[0]
      }

      const containerRes = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.accountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(containerParams),
        }
      )
      const container = await containerRes.json()

      if (!container.id) {
        return { success: false, error: container.error?.message || 'Failed to create media container' }
      }

      // Step 2: Publish
      const publishRes = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.accountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: container.id,
            access_token: credentials.accessToken,
          }),
        }
      )
      const result = await publishRes.json()

      if (result.id) {
        return { success: true, platformPostId: result.id, url: `https://instagram.com/p/${result.id}` }
      }
      return { success: false, error: result.error?.message || 'Publish failed' }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  },

  getRequirements(): PlatformRequirements {
    return {
      maxChars: 2200,
      maxHashtags: 30,
      imageFormats: ['jpg', 'jpeg', 'png'],
      maxImageSize: 8,
      videoFormats: ['mp4', 'mov'],
      maxVideoSize: 100,
      maxImages: 10,
      supportsCarousel: true,
      supportsStories: true,
      supportsReels: true,
    }
  },

  getCredentialFields() {
    return [
      { key: 'accountId', label: 'Instagram Business Account ID', type: 'text' as const, required: true },
      { key: 'accessToken', label: 'Page Access Token', type: 'password' as const, required: true },
    ]
  },
}
