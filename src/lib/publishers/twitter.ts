import crypto from 'crypto'
import type { Publisher, NormalizedPost, ConnectedAccount, ValidationResult, PlatformPayload, PublishResult } from './core/types'
import { AuthError, RateLimitError } from './core/errors'

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

function generateOAuthSignature(
  method: string, url: string, params: Record<string, string>,
  consumerSecret: string, tokenSecret: string
): string {
  const sortedKeys = Object.keys(params).sort()
  const paramString = sortedKeys.map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`).join('&')
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')
}

function buildOAuthHeader(
  method: string, url: string,
  consumerKey: string, consumerSecret: string,
  accessToken: string, accessTokenSecret: string,
  extraParams: Record<string, string> = {}
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: '1.0',
  }
  const allParams = { ...oauthParams, ...extraParams }
  const signature = generateOAuthSignature(method, url, allParams, consumerSecret, accessTokenSecret)
  oauthParams.oauth_signature = signature
  const headerParts = Object.keys(oauthParams).sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ')
  return `OAuth ${headerParts}`
}

function getCreds(account: ConnectedAccount) {
  return {
    ck: account.metadata?.consumerKey || process.env.TWITTER_CONSUMER_KEY || '',
    cs: account.metadata?.consumerSecret || process.env.TWITTER_CONSUMER_SECRET || '',
    at: account.metadata?.accessToken || account.accessToken || process.env.TWITTER_ACCESS_TOKEN || '',
    ats: account.metadata?.accessTokenSecret || process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
  }
}

export const twitterPublisher: Publisher = {
  platform: 'twitter',

  async validate(post: NormalizedPost): Promise<ValidationResult> {
    const errors: string[] = []
    const text = post.variations?.twitter?.text || post.text
    if (text.length > 280) errors.push(`Text too long: ${text.length}/280 chars`)
    if (post.media.length > 4) errors.push(`Too many media: ${post.media.length}/4 max`)
    return { valid: errors.length === 0, errors }
  },

  async preparePayload(post: NormalizedPost, account: ConnectedAccount): Promise<PlatformPayload> {
    const { ck, cs, at, ats } = getCreds(account)
    const text = post.variations?.twitter?.text || post.text
    const tweetUrl = 'https://api.twitter.com/2/tweets'

    // Upload media if present
    let mediaIds: string[] = []
    for (const media of post.media.slice(0, 4)) {
      const imgRes = await fetch(media.url)
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
      const base64 = imgBuffer.toString('base64')
      const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json'
      const uploadParams: Record<string, string> = { media_data: base64 }
      const authHeader = buildOAuthHeader('POST', uploadUrl, ck, cs, at, ats, uploadParams)
      const formBody = new URLSearchParams(uploadParams)
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
      })
      if (!uploadRes.ok) throw new Error(`Twitter media upload failed: ${await uploadRes.text()}`)
      const uploadData = await uploadRes.json()
      mediaIds.push(uploadData.media_id_string)
    }

    const body: Record<string, unknown> = { text }
    if (mediaIds.length > 0) body.media = { media_ids: mediaIds }

    const authHeader = buildOAuthHeader('POST', tweetUrl, ck, cs, at, ats)
    return {
      platform: 'twitter',
      url: tweetUrl,
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body,
    }
  },

  async publish(payload: PlatformPayload, account: ConnectedAccount): Promise<PublishResult> {
    const res = await fetch(payload.url, {
      method: payload.method || 'POST',
      headers: payload.headers,
      body: JSON.stringify(payload.body),
    })

    if (res.status === 401) throw new AuthError('twitter')
    if (res.status === 429) throw new RateLimitError('twitter', parseInt(res.headers.get('retry-after') || '60') * 1000)

    if (!res.ok) {
      return { success: false, platform: 'twitter', error: `Twitter API ${res.status}: ${await res.text()}` }
    }

    const data = await res.json()
    const id = data.data?.id
    return {
      success: true,
      platform: 'twitter',
      postId: id,
      postUrl: `https://twitter.com/i/status/${id}`,
      rawResponse: data,
    }
  },
}
