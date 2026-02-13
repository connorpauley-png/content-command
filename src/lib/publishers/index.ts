import type { Publisher, NormalizedPost, ConnectedAccount } from './core/types'
import { twitterPublisher } from './twitter'
import { linkedinPublisher } from './linkedin'
import { facebookPublisher } from './facebook'
import { instagramPublisher } from './instagram'
import { gbpPublisher } from './gbp'
import { orchestratePublish } from './orchestrator'

export type { PublishResult } from './core/types'
export type { OrchestratorResult } from './orchestrator'

const registry: Record<string, Publisher> = {
  twitter: twitterPublisher,
  linkedin: linkedinPublisher,
  facebook: facebookPublisher,
  instagram: instagramPublisher,
  google_business: gbpPublisher,
}

export function getPublisher(platform: string): Publisher {
  const publisher = registry[platform]
  if (!publisher) throw new Error(`No publisher registered for platform: ${platform}`)
  return publisher
}

export async function publishPost(
  post: NormalizedPost,
  accounts: ConnectedAccount[]
) {
  return orchestratePublish(post, accounts)
}
