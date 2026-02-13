import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedKeys = Object.keys(params).sort()
  const paramString = sortedKeys.map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`).join('&')
  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`
  return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64')
}

function buildOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  accessToken: string,
  accessTokenSecret: string,
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

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ')

  return `OAuth ${headerParts}`
}

export async function POST(req: NextRequest) {
  try {
    const { content, mediaUrls, consumerKey, consumerSecret, accessToken, accessTokenSecret } = await req.json()

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      return NextResponse.json({ success: false, error: 'Missing Twitter credentials' })
    }

    let mediaId: string | null = null

    // Upload media if present
    if (mediaUrls && mediaUrls.length > 0) {
      // Download image
      const imgRes = await fetch(mediaUrls[0])
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
      const base64 = imgBuffer.toString('base64')

      const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json'

      const uploadParams: Record<string, string> = {
        media_data: base64,
      }

      const authHeader = buildOAuthHeader('POST', uploadUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret, uploadParams)

      const formBody = new URLSearchParams(uploadParams)
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
      })

      if (!uploadRes.ok) {
        const errText = await uploadRes.text()
        return NextResponse.json({ success: false, error: `Twitter media upload failed: ${errText}` })
      }

      const uploadData = await uploadRes.json()
      mediaId = uploadData.media_id_string
    }

    // Post tweet
    const tweetUrl = 'https://api.twitter.com/2/tweets'
    const tweetBody: Record<string, unknown> = { text: content }

    if (mediaId) {
      tweetBody.media = { media_ids: [mediaId] }
    }

    const authHeader = buildOAuthHeader('POST', tweetUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret)

    const tweetRes = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetBody),
    })

    if (!tweetRes.ok) {
      const errText = await tweetRes.text()
      return NextResponse.json({ success: false, error: `Twitter post failed ${tweetRes.status}: ${errText}` })
    }

    const tweetData = await tweetRes.json()
    return NextResponse.json({ success: true, platformPostId: tweetData.data?.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message })
  }
}
