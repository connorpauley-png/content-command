import type { Platform, PlatformAdapter } from '@/types'
import { instagramAdapter } from './instagram'
import { facebookAdapter } from './facebook'
import { linkedinAdapter } from './linkedin'
import { twitterAdapter } from './twitter'
import { tiktokAdapter, googleBusinessAdapter, nextdoorAdapter } from './stubs'

export const platformAdapters: Record<Platform, PlatformAdapter> = {
  instagram: instagramAdapter,
  facebook: facebookAdapter,
  linkedin: linkedinAdapter,
  twitter: twitterAdapter,
  tiktok: tiktokAdapter,
  google_business: googleBusinessAdapter,
  nextdoor: nextdoorAdapter,
}

export const allPlatforms: Platform[] = [
  'instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'google_business', 'nextdoor',
]

export function getAdapter(platform: Platform): PlatformAdapter {
  return platformAdapters[platform]
}
