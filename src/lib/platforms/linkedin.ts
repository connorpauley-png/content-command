import type { PlatformAdapter, PlatformRequirements } from '@/types'

export const linkedinAdapter: PlatformAdapter = {
  name: 'linkedin',
  displayName: 'LinkedIn',
  icon: '💼',
  color: '#0A66C2',

  async validateCredentials(credentials) {
    try {
      const res = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      })
      return res.ok
    } catch {
      return false
    }
  },

  async publish(post, credentials) {
    try {
      const author = `urn:li:person:${credentials.personUrn}`
      const body: Record<string, unknown> = {
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `${post.content}\n\n${post.hashtags.map((h) => `#${h}`).join(' ')}`,
            },
            shareMediaCategory: post.mediaUrls.length > 0 ? 'IMAGE' : 'NONE',
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }

      const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(body),
      })
      const result = await res.json()

      if (res.ok) {
        return { success: true, platformPostId: result.id, url: `https://linkedin.com/feed/update/${result.id}` }
      }
      return { success: false, error: result.message || 'Failed to publish' }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
    }
  },

  getRequirements(): PlatformRequirements {
    return {
      maxChars: 3000,
      maxHashtags: 30,
      imageFormats: ['jpg', 'jpeg', 'png', 'gif'],
      maxImageSize: 10,
      videoFormats: ['mp4'],
      maxVideoSize: 200,
      maxImages: 9,
      supportsCarousel: true,
      supportsStories: false,
      supportsReels: false,
    }
  },

  getCredentialFields() {
    return [
      { key: 'accessToken', label: 'Access Token', type: 'password' as const, required: true },
      { key: 'personUrn', label: 'Person URN (sub value)', type: 'text' as const, required: true },
    ]
  },
}
