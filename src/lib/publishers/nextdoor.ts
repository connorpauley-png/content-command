import { PublishResult } from './types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function publishToNextdoor(_content: string, _photoUrls: string[]): Promise<PublishResult> {
  console.log('[Nextdoor] Stub — no public API')
  return { success: false, error: 'Nextdoor has no API — use browser automation' }
}
