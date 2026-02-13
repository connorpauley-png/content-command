import type { Platform, PlatformAdapter } from '@/types'
import { getPublisher } from '@/lib/publishers'

// UI metadata + credential fields for each platform
// Actual publishing is delegated to the publisher system

const stubValidate = async () => false

function makeAdapter(
  name: Platform,
  displayName: string,
  icon: string,
  color: string,
  requirements: {
    maxChars: number; maxHashtags?: number; maxImages?: number;
    supportsCarousel?: boolean; supportsStories?: boolean; supportsReels?: boolean;
  },
  credentialFields: { key: string; label: string; type: 'text' | 'password'; required: boolean }[]
): PlatformAdapter {
  return {
    name,
    displayName,
    icon,
    color,
    async validateCredentials(credentials) {
      // Lightweight — just check keys exist
      return credentialFields.filter(f => f.required).every(f => !!credentials[f.key])
    },
    async publish(post, credentials) {
      // Delegate to new publisher system
      try {
        const publisher = getPublisher(name)
        const text = post.content + (post.hashtags?.length ? '\n\n' + post.hashtags.map((h: string) => `#${h}`).join(' ') : '')
        const normalizedPost = {
          id: post.id || `post-${Date.now()}`,
          text,
          media: (post.mediaUrls || []).map((url: string) => ({ url, type: 'image' as const })),
          scheduling: null,
          metadata: { generatedBy: 'manual' as const },
        }
        const account = {
          platform: name,
          accountType: 'personal' as const,
          accessToken: credentials.accessToken || credentials.pageToken || '',
          platformAccountId: credentials.pageId || credentials.igAccountId || credentials.accountId || '',
          metadata: credentials,
        }
        const payload = await publisher.preparePayload(normalizedPost, account)
        const result = await publisher.publish(payload, account)
        return {
          success: result.success,
          platformPostId: result.postId,
          url: result.postUrl,
          error: result.error,
        }
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
      }
    },
    getRequirements() {
      return {
        maxChars: requirements.maxChars,
        maxHashtags: requirements.maxHashtags ?? 30,
        imageFormats: ['jpg', 'jpeg', 'png', 'gif'],
        maxImageSize: 10,
        videoFormats: ['mp4'],
        maxVideoSize: 100,
        maxImages: requirements.maxImages ?? 4,
        supportsCarousel: requirements.supportsCarousel ?? false,
        supportsStories: requirements.supportsStories ?? false,
        supportsReels: requirements.supportsReels ?? false,
      }
    },
    getCredentialFields() { return credentialFields },
  }
}

export const platformAdapters: Record<Platform, PlatformAdapter> = {
  twitter: makeAdapter('twitter', 'Twitter / X', '𝕏', '#000000',
    { maxChars: 280, maxHashtags: 10, maxImages: 4 },
    [
      { key: 'bearerToken', label: 'Bearer Token', type: 'password', required: true },
      { key: 'consumerKey', label: 'Consumer Key', type: 'text', required: true },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true },
      { key: 'accessToken', label: 'Access Token', type: 'text', required: true },
      { key: 'accessTokenSecret', label: 'Access Token Secret', type: 'password', required: true },
    ]),
  instagram: makeAdapter('instagram', 'Instagram', '📸', '#E4405F',
    { maxChars: 2200, maxImages: 10, supportsCarousel: true, supportsStories: true, supportsReels: true },
    [
      { key: 'accountId', label: 'Instagram Business Account ID', type: 'text', required: true },
      { key: 'accessToken', label: 'Page Access Token', type: 'password', required: true },
    ]),
  facebook: makeAdapter('facebook', 'Facebook', '👤', '#1877F2',
    { maxChars: 63206, maxImages: 10, supportsCarousel: true, supportsStories: true, supportsReels: true },
    [
      { key: 'pageId', label: 'Facebook Page ID', type: 'text', required: true },
      { key: 'pageToken', label: 'Page Access Token', type: 'password', required: true },
    ]),
  linkedin: makeAdapter('linkedin', 'LinkedIn', '💼', '#0A66C2',
    { maxChars: 3000, maxImages: 9, supportsCarousel: true },
    [
      { key: 'accessToken', label: 'Access Token', type: 'password', required: true },
      { key: 'personUrn', label: 'Person URN (sub value)', type: 'text', required: true },
    ]),
  tiktok: makeAdapter('tiktok', 'TikTok', '🎵', '#000000',
    { maxChars: 2200 },
    [{ key: 'accessToken', label: 'Access Token', type: 'password', required: true }]),
  google_business: makeAdapter('google_business', 'Google Business', '📍', '#4285F4',
    { maxChars: 1500 },
    [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'locationId', label: 'Location ID', type: 'text', required: true },
    ]),
  nextdoor: makeAdapter('nextdoor', 'Nextdoor', '🏘️', '#8ED500',
    { maxChars: 2000 },
    [{ key: 'apiKey', label: 'API Key', type: 'password', required: true }]),
}

export const allPlatforms: Platform[] = [
  'instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'google_business', 'nextdoor',
]

export function getAdapter(platform: Platform): PlatformAdapter {
  return platformAdapters[platform]
}
