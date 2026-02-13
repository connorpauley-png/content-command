export class PublisherError extends Error {
  constructor(public platform: string, message: string, public retryable: boolean = false) {
    super(`[${platform}] ${message}`)
  }
}

export class AuthError extends PublisherError {
  constructor(platform: string) {
    super(platform, 'Authentication failed — token may be expired', false)
  }
}

export class RateLimitError extends PublisherError {
  constructor(platform: string, public retryAfterMs?: number) {
    super(platform, 'Rate limited', true)
  }
}

export class ValidationError extends PublisherError {
  constructor(platform: string, public errors: string[]) {
    super(platform, `Validation failed: ${errors.join(', ')}`, false)
  }
}
