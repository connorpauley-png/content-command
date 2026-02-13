import crypto from 'crypto'

export interface PublishResult {
  success: boolean
  postId?: string
  url?: string
  error?: string
}

const CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY || ''
const CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET || ''
const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || ''
const ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET || ''

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

export async function publishToTwitter(
  text: string,
  mediaUrls?: string[],
  options?: {
    consumerKey?: string; consumerSecret?: string;
    accessToken?: string; accessTokenSecret?: string;
    dryRun?: boolean
  }
): Promise<PublishResult> {
  const ck = options?.consumerKey || CONSUMER_KEY
  const cs = options?.consumerSecret || CONSUMER_SECRET
  const at = options?.accessToken || ACCESS_TOKEN
  const ats = options?.accessTokenSecret || ACCESS_TOKEN_SECRET

  if (options?.dryRun) {
    return {
      success: true,
      postId: 'dry-run-twitter',
      url: 'https://twitter.com/pauley_connor/status/dry-run',
      error: undefined,
    }
  }

  try {
    let mediaId: string | null = null

    if (mediaUrls && mediaUrls.length > 0) {
      const imgRes = await fetch(mediaUrls[0])
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
      if (!uploadRes.ok) {
        return { success: false, error: `Twitter media upload failed: ${await uploadRes.text()}` }
      }
      const uploadData = await uploadRes.json()
      mediaId = uploadData.media_id_string
    }

    const tweetUrl = 'https://api.twitter.com/2/tweets'
    const tweetBody: Record<string, unknown> = { text }
    if (mediaId) tweetBody.media = { media_ids: [mediaId] }

    const authHeader = buildOAuthHeader('POST', tweetUrl, ck, cs, at, ats)
    const tweetRes = await fetch(tweetUrl, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(tweetBody),
    })

    if (!tweetRes.ok) {
      return { success: false, error: `Twitter post failed ${tweetRes.status}: ${await tweetRes.text()}` }
    }

    const tweetData = await tweetRes.json()
    const id = tweetData.data?.id
    return { success: true, postId: id, url: `https://twitter.com/pauley_connor/status/${id}` }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
