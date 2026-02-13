import { getPublisher } from './index'
import { withRetry } from './core/retry'
import type { NormalizedPost, ConnectedAccount, PublishResult } from './core/types'

export interface OrchestratorResult {
  success: boolean
  results: PublishResult[]
  failures: { platform: string; error: string }[]
}

export async function orchestratePublish(
  post: NormalizedPost,
  accounts: ConnectedAccount[]
): Promise<OrchestratorResult> {
  const results: PublishResult[] = []
  const failures: { platform: string; error: string }[] = []

  // Validate all platforms first
  for (const account of accounts) {
    const publisher = getPublisher(account.platform)
    const validation = await publisher.validate(post, account)
    if (!validation.valid) {
      failures.push({ platform: account.platform, error: validation.errors.join(', ') })
    }
  }

  if (failures.length > 0) {
    return { success: false, results: [], failures }
  }

  // Publish to each platform
  for (const account of accounts) {
    try {
      const publisher = getPublisher(account.platform)
      const payload = await publisher.preparePayload(post, account)
      const result = await withRetry(
        () => publisher.publish(payload, account),
        { maxRetries: 3, baseDelayMs: 1000, platform: account.platform }
      )
      results.push(result)
    } catch (error: any) {
      failures.push({ platform: account.platform, error: error.message })
    }
  }

  return {
    success: failures.length === 0,
    results,
    failures,
  }
}
