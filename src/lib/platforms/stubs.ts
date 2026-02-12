import type { PlatformAdapter, PlatformRequirements } from '@/types'

const stubPublish = async () => ({ success: false as const, error: 'Platform not yet implemented' })
const stubValidate = async () => false

const defaultRequirements: PlatformRequirements = {
  maxChars: 2200, maxHashtags: 30, imageFormats: ['jpg', 'png'],
  maxImageSize: 10, videoFormats: ['mp4'], maxVideoSize: 100,
  maxImages: 1, supportsCarousel: false, supportsStories: false, supportsReels: false,
}

export const tiktokAdapter: PlatformAdapter = {
  name: 'tiktok', displayName: 'TikTok', icon: '🎵', color: '#000000',
  validateCredentials: stubValidate, publish: stubPublish,
  getRequirements: () => ({ ...defaultRequirements, maxChars: 2200 }),
  getCredentialFields: () => [
    { key: 'accessToken', label: 'Access Token', type: 'password' as const, required: true },
  ],
}

export const googleBusinessAdapter: PlatformAdapter = {
  name: 'google_business', displayName: 'Google Business', icon: '📍', color: '#4285F4',
  validateCredentials: stubValidate, publish: stubPublish,
  getRequirements: () => ({ ...defaultRequirements, maxChars: 1500 }),
  getCredentialFields: () => [
    { key: 'apiKey', label: 'API Key', type: 'password' as const, required: true },
    { key: 'locationId', label: 'Location ID', type: 'text' as const, required: true },
  ],
}

export const nextdoorAdapter: PlatformAdapter = {
  name: 'nextdoor', displayName: 'Nextdoor', icon: '🏘️', color: '#8ED500',
  validateCredentials: stubValidate, publish: stubPublish,
  getRequirements: () => ({ ...defaultRequirements, maxChars: 2000 }),
  getCredentialFields: () => [
    { key: 'apiKey', label: 'API Key', type: 'password' as const, required: true },
  ],
}
