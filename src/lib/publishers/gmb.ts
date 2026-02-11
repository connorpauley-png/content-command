import { PublishResult } from './types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function publishToGMB(_content: string, _photoUrls: string[]): Promise<PublishResult> {
  console.log('[GMB] Stub — not configured')
  return { success: false, error: 'GMB not configured — needs Google Cloud project setup' }
}
