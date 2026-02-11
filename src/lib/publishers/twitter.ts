import { OAuth } from 'oauth'
import { PublishResult } from './types'

const CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY || ''
const CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET || ''
const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || ''
const ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET || ''

function getOAuth() {
  return new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    CONSUMER_KEY,
    CONSUMER_SECRET,
    '1.0A',
    null,
    'HMAC-SHA1'
  )
}

async function uploadMedia(photoUrl: string): Promise<string | null> {
  try {
    const imgRes = await fetch(photoUrl)
    if (!imgRes.ok) return null
    const buffer = Buffer.from(await imgRes.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mediaType = imgRes.headers.get('content-type') || 'image/jpeg'
    const oauth = getOAuth()

    return new Promise((resolve) => {
      // INIT
      const initBody = new URLSearchParams({
        command: 'INIT',
        total_bytes: buffer.length.toString(),
        media_type: mediaType,
      }).toString()

      oauth.post(
        'https://upload.twitter.com/1.1/media/upload.json',
        ACCESS_TOKEN, ACCESS_SECRET,
        initBody, 'application/x-www-form-urlencoded',
        (err: unknown, data: unknown) => {
          if (err) { resolve(null); return }
          try {
            const parsed = JSON.parse(data as string)
            const mediaId = parsed.media_id_string

            // APPEND
            const appendBody = new URLSearchParams({
              command: 'APPEND',
              media_id: mediaId,
              segment_index: '0',
              media_data: base64,
            }).toString()

            oauth.post(
              'https://upload.twitter.com/1.1/media/upload.json',
              ACCESS_TOKEN, ACCESS_SECRET,
              appendBody, 'application/x-www-form-urlencoded',
              (err2: unknown) => {
                if (err2) { resolve(null); return }

                // FINALIZE
                const finalBody = new URLSearchParams({
                  command: 'FINALIZE',
                  media_id: mediaId,
                }).toString()

                oauth.post(
                  'https://upload.twitter.com/1.1/media/upload.json',
                  ACCESS_TOKEN, ACCESS_SECRET,
                  finalBody, 'application/x-www-form-urlencoded',
                  (err3: unknown) => {
                    if (err3) { resolve(null); return }
                    resolve(mediaId)
                  }
                )
              }
            )
          } catch {
            resolve(null)
          }
        }
      )
    })
  } catch {
    return null
  }
}

export async function publishToTwitter(content: string, photoUrls: string[]): Promise<PublishResult> {
  try {
    console.log(`[Twitter] Publishing tweet (${content.length} chars, ${photoUrls.length} photos)`)
    const text = content.length > 280 ? content.slice(0, 277) + '...' : content
    const oauth = getOAuth()

    // Upload media (max 4)
    const mediaIds: string[] = []
    for (const url of photoUrls.slice(0, 4)) {
      const mediaId = await uploadMedia(url)
      if (mediaId) mediaIds.push(mediaId)
    }

    const tweetPayload: Record<string, unknown> = { text }
    if (mediaIds.length > 0) {
      tweetPayload.media = { media_ids: mediaIds }
    }

    return new Promise((resolve) => {
      oauth.post(
        'https://api.twitter.com/2/tweets',
        ACCESS_TOKEN, ACCESS_SECRET,
        JSON.stringify(tweetPayload), 'application/json',
        (err: unknown, data: unknown) => {
          if (err) {
            const e = err as { statusCode?: number; data?: string }
            const statusCode = e.statusCode || 0
            const errData = e.data || ''

            // Rate limit detection
            if (statusCode === 429) {
              console.error('[Twitter] Rate limited')
              resolve({ success: false, error: 'Twitter rate limit hit. Try again later.' })
              return
            }
            // Duplicate detection
            if (typeof errData === 'string' && errData.includes('duplicate')) {
              console.error('[Twitter] Duplicate content detected')
              resolve({ success: false, error: 'Duplicate tweet — Twitter rejected identical content.' })
              return
            }

            console.error(`[Twitter] Error: ${statusCode} ${errData}`)
            resolve({ success: false, error: `Twitter error: ${statusCode} ${errData}` })
            return
          }
          try {
            const parsed = JSON.parse(data as string)
            const postId = parsed.data?.id
            console.log(`[Twitter] Published: ${postId}`)
            resolve({
              success: true,
              postId,
              postUrl: postId ? `https://x.com/your_handle/status/${postId}` : undefined,
            })
          } catch {
            resolve({ success: false, error: 'Failed to parse Twitter response' })
          }
        }
      )
    })
  } catch (e) {
    console.error(`[Twitter] Exception: ${e}`)
    return { success: false, error: `Twitter exception: ${e}` }
  }
}
