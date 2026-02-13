import { publishToTwitter } from './twitter'
import { publishToLinkedIn } from './linkedin'
import { publishToFacebook } from './facebook'
import { publishToInstagram } from './instagram'
import type { PlatformAccount } from '@/types'

export type { PublishResult } from './twitter'

export interface PublishOptions {
  dryRun?: boolean
}

export async function publishPost(
  content: string,
  account: PlatformAccount,
  mediaUrls: string[],
  options?: PublishOptions
) {
  const creds = account.credentials || {}
  const dryRun = options?.dryRun

  switch (account.platform) {
    case 'twitter':
      return publishToTwitter(content, mediaUrls.length ? mediaUrls : undefined, {
        consumerKey: creds.consumerKey,
        consumerSecret: creds.consumerSecret,
        accessToken: creds.accessToken,
        accessTokenSecret: creds.accessTokenSecret,
        dryRun,
      })

    case 'linkedin':
      return publishToLinkedIn(content, mediaUrls.length ? mediaUrls : undefined, {
        accessToken: creds.accessToken,
        personUrn: creds.personUrn,
        dryRun,
      })

    case 'facebook':
      return publishToFacebook(
        content,
        creds.pageId || '329295713601076',
        creds.pageToken || creds.accessToken || '',
        mediaUrls.length ? mediaUrls : undefined,
        { dryRun }
      )

    case 'instagram':
      if (!mediaUrls.length) {
        return { success: false, error: 'Instagram requires at least one image' }
      }
      return publishToInstagram(
        content,
        mediaUrls[0],
        creds.igAccountId || creds.businessAccountId || '',
        creds.pageToken || creds.accessToken || '',
        { dryRun }
      )

    default:
      return { success: false, error: `Unsupported platform: ${account.platform}` }
  }
}

export { publishToTwitter, publishToLinkedIn, publishToFacebook, publishToInstagram }
