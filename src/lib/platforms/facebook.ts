import type { PlatformAdapter, PlatformRequirements } from '@/types'

export const facebookAdapter: PlatformAdapter = {
  name: 'facebook',
  displayName: 'Facebook',
  icon: '👤',
  color: '#1877F2',

  async validateCredentials(credentials) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.pageId}?fields=id,name&access_token=${credentials.pageToken}`
      )
      return res.ok
    } catch {
      return false
    }
  },

  async publish(post, credentials) {
    try {
      const body: Record<string, string> = {
        message: `${post.content}\n\n${post.hashtags.map((h) => `#${h}`).join(' ')}`,
        access_token: credentials.pageToken,
      }

      if (post.mediaUrls.length > 0) {
        // Photo post
        const res = await fetch(
          `https://graph.facebook.com/v18.0/${credentials.pageId}/photos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...body, url: post.mediaUrls[0] }),
          }
        )
        const result = await res.json()
        if (result.id) {
          return { success: true, platformPostId: result.id, url: `https://facebook.com/${result.id}` }
        }
        return { success: false, error: result.error?.message || 'Failed to publish photo' }
      }

      // Text post
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${credentials.pageId}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      const result = await res.json()
      if (result.id) {
        return { success: true, platformPostId: result.id, url: `https://facebook.com/${result.id}` }
      }
      return { success: false, error: result.error?.message || 'Failed to publish' }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  },

  getRequirements(): PlatformRequirements {
    return {
      maxChars: 63206,
      maxHashtags: 30,
      imageFormats: ['jpg', 'jpeg', 'png', 'gif'],
      maxImageSize: 10,
      videoFormats: ['mp4', 'mov'],
      maxVideoSize: 1024,
      maxImages: 10,
      supportsCarousel: true,
      supportsStories: true,
      supportsReels: true,
    }
  },

  getCredentialFields() {
    return [
      { key: 'pageId', label: 'Facebook Page ID', type: 'text' as const, required: true },
      { key: 'pageToken', label: 'Page Access Token (Permanent)', type: 'password' as const, required: true },
    ]
  },
}
