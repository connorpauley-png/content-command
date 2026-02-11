// Post validation — blocks publishing if requirements aren't met

export type ValidationError = {
  platform: string | 'all'
  field: string
  message: string
  severity: 'error' | 'warning'
}

const ENHANCED_PHOTO_PREFIX = 'process.env.NEXT_PUBLIC_SUPABASE_URL/storage/v1/object/public/enhanced-photos/'

// Emoji regex — only actual emoji, NOT typographic chars like em dash, bullet, arrows
// Covers: emoticons, symbols, transport, flags, supplemental symbols
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/u

const PLATFORM_LIMITS: Record<string, number> = {
  x: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  ig_personal: 2200,
  gmb: 1500,
  nextdoor: 10000,
}

const UNAVAILABLE_PLATFORMS = ['gmb', 'nextdoor']

const PLATFORM_NAMES: Record<string, string> = {
  x: 'X/Twitter',
  facebook: 'Facebook',
  instagram: 'Instagram (Business)',
  ig_personal: 'Instagram (@personal_brand)',
  linkedin: 'LinkedIn',
  gmb: 'Google Business',
  nextdoor: 'Nextdoor',
}

export function validatePost(
  content: string,
  platforms: string[],
  photoUrls: string[],
  status: string
): ValidationError[] {
  const errors: ValidationError[] = []

  // === Global checks ===

  if (!content || content.trim().length === 0) {
    errors.push({
      platform: 'all',
      field: 'content',
      message: 'Post content cannot be empty.',
      severity: 'error',
    })
  }

  if (status !== 'approved') {
    errors.push({
      platform: 'all',
      field: 'status',
      message: `Post must be approved before publishing. Current status: ${status}`,
      severity: 'error',
    })
  }

  // No emojis — hard rule
  if (content && EMOJI_REGEX.test(content)) {
    // Find the emojis to show which ones
    const found = content.match(new RegExp(EMOJI_REGEX.source, 'gu')) || []
    const unique = [...new Set(found)].slice(0, 5)
    errors.push({
      platform: 'all',
      field: 'content',
      message: `No emojis allowed. Found: ${unique.join(' ')}`,
      severity: 'error',
    })
  }

  // Photo enhancement check — warn only, photos will be auto-enhanced during publish
  const unenhancedPhotos = (photoUrls || []).filter(
    (url) => !url.startsWith(ENHANCED_PHOTO_PREFIX)
  )
  if (unenhancedPhotos.length > 0) {
    errors.push({
      platform: 'all',
      field: 'photos',
      message: `${unenhancedPhotos.length} photo(s) will be auto-enhanced before posting.`,
      severity: 'warning',
    })
  }

  if (platforms.length === 0) {
    errors.push({
      platform: 'all',
      field: 'platforms',
      message: 'No platforms selected.',
      severity: 'error',
    })
  }

  // === Per-platform checks ===

  for (const platform of platforms) {
    const name = PLATFORM_NAMES[platform] || platform

    // Unavailable platforms — warn, don't block (publisher handles gracefully)
    if (UNAVAILABLE_PLATFORMS.includes(platform)) {
      errors.push({
        platform,
        field: 'platform',
        message: `${name} is not connected yet. It will be skipped.`,
        severity: 'warning',
      })
      continue
    }

    // Character limits — X auto-truncates so just warn, others hard block
    const limit = PLATFORM_LIMITS[platform]
    if (limit && content && content.length > limit) {
      if (platform === 'x') {
        // Publisher auto-truncates to 277 + "..." so just warn
        errors.push({
          platform,
          field: 'content',
          message: `X/Twitter will auto-truncate your post (${content.length}/${limit} chars). The rest will be cut off.`,
          severity: 'warning',
        })
      } else {
        errors.push({
          platform,
          field: 'content',
          message: `${name} has a ${limit} character limit. Your post is ${content.length} characters (${content.length - limit} over).`,
          severity: 'error',
        })
      }
    }

    // Instagram requires photos — warn so other platforms still post
    if ((platform === 'instagram' || platform === 'ig_personal') && (!photoUrls || photoUrls.length === 0)) {
      errors.push({
        platform,
        field: 'photos',
        message: 'Instagram requires at least 1 photo. Instagram will be skipped unless you add one.',
        severity: 'warning',
      })
    }

    // Warnings (non-blocking)
    if (platform === 'facebook' && (!photoUrls || photoUrls.length === 0)) {
      errors.push({
        platform,
        field: 'photos',
        message: 'Facebook posts with photos get 2-3x more engagement. Consider adding one.',
        severity: 'warning',
      })
    }

    if (platform === 'linkedin' && content && content.length < 100) {
      errors.push({
        platform,
        field: 'content',
        message: 'LinkedIn posts under 100 characters tend to get less engagement.',
        severity: 'warning',
      })
    }

    if (platform === 'x' && content && content.length > 250) {
      errors.push({
        platform,
        field: 'content',
        message: `X post is ${content.length}/280 characters. Close to the limit.`,
        severity: 'warning',
      })
    }
  }

  return errors
}

export function hasBlockingErrors(errors: ValidationError[]): boolean {
  return errors.some((e) => e.severity === 'error')
}

export function getErrorsByPlatform(errors: ValidationError[]): Record<string, ValidationError[]> {
  const grouped: Record<string, ValidationError[]> = {}
  for (const err of errors) {
    const key = err.platform
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(err)
  }
  return grouped
}
