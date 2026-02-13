import { PublisherError } from './errors'

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; baseDelayMs: number; platform: string }
): Promise<T> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      const isRetryable = err instanceof PublisherError && err.retryable
      if (!isRetryable || attempt >= options.maxRetries) {
        throw err
      }
      const delay = options.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500
      console.log(`[${options.platform}] Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError
}
