import { NextRequest, NextResponse } from 'next/server'
import { ensurePublicUrl } from '@/lib/image-proxy'

export async function POST(req: NextRequest) {
  try {
    const { post, account } = await req.json()

    if (!post || !account) {
      return NextResponse.json({ success: false, error: 'Missing post or account' })
    }

    const content = post.content + (post.hashtags?.length ? '\n\n' + post.hashtags.map((t: string) => `#${t}`).join(' ') : '')
    
    // Ensure all image URLs are publicly accessible (re-uploads Astria/private URLs to Supabase)
    const rawUrls = post.mediaUrls || []
    const mediaUrls = await Promise.all(rawUrls.map((url: string) => ensurePublicUrl(url)))
    const creds = account.credentials || {}
    const origin = req.nextUrl.origin

    let result: { success: boolean; platformPostId?: string; error?: string }

    switch (account.platform) {
      case 'instagram': {
        const res = await fetch(`${origin}/api/publish/instagram`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            mediaUrls,
            igAccountId: creds.igAccountId || creds.businessAccountId,
            pageToken: creds.pageToken || creds.accessToken,
          }),
        })
        result = await res.json()
        break
      }
      case 'facebook': {
        const res = await fetch(`${origin}/api/publish/facebook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            mediaUrls,
            pageId: creds.pageId,
            pageToken: creds.pageToken || creds.accessToken,
          }),
        })
        result = await res.json()
        break
      }
      case 'linkedin': {
        const res = await fetch(`${origin}/api/publish/linkedin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            mediaUrls,
            accessToken: creds.accessToken,
            personUrn: creds.personUrn,
          }),
        })
        result = await res.json()
        break
      }
      case 'twitter': {
        const res = await fetch(`${origin}/api/publish/twitter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            mediaUrls,
            consumerKey: creds.consumerKey || creds.apiKey,
            consumerSecret: creds.consumerSecret || creds.apiSecret,
            accessToken: creds.accessToken,
            accessTokenSecret: creds.accessTokenSecret,
          }),
        })
        result = await res.json()
        break
      }
      default:
        result = { success: false, error: `Unsupported platform: ${account.platform}` }
    }

    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message })
  }
}
