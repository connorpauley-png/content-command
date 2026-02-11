import { PublishResult } from './types'
import { publishToTwitter } from './twitter'
import { publishToFacebook } from './facebook'
import { publishToInstagram } from './instagram'
import { publishToInstagramPersonal } from './instagram-personal'
import { publishToLinkedIn } from './linkedin'
import { publishToGMB } from './gmb'
import { publishToNextdoor } from './nextdoor'

export type { PublishResult }
export { publishToTwitter, publishToFacebook, publishToInstagram, publishToInstagramPersonal, publishToLinkedIn, publishToGMB, publishToNextdoor }

const publishers: Record<string, (content: string, photoUrls: string[]) => Promise<PublishResult>> = {
  x: publishToTwitter,
  facebook: publishToFacebook,
  instagram: publishToInstagram,
  ig_personal: publishToInstagramPersonal,
  linkedin: publishToLinkedIn,
  gmb: publishToGMB,
  nextdoor: publishToNextdoor,
}

export async function publishToPlatform(
  platform: string,
  content: string,
  photoUrls: string[]
): Promise<PublishResult> {
  const publisher = publishers[platform]
  if (!publisher) return { success: false, error: `Unknown platform: ${platform}` }

  try {
    return await publisher(content, photoUrls)
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : `Unknown error publishing to ${platform}` }
  }
}

export async function publishToAllPlatforms(
  platforms: string[],
  content: string,
  photoUrls: string[]
): Promise<Record<string, PublishResult>> {
  const results = await Promise.allSettled(
    platforms.map(async (platform) => ({
      platform,
      result: await publishToPlatform(platform, content, photoUrls),
    }))
  )

  const out: Record<string, PublishResult> = {}
  for (const r of results) {
    if (r.status === 'fulfilled') {
      out[r.value.platform] = r.value.result
    } else {
      out['unknown'] = { success: false, error: r.reason?.message }
    }
  }
  return out
}
