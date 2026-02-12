import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { content, mediaUrls, pageId, pageToken } = await req.json()

    if (!pageId || !pageToken) {
      return NextResponse.json({ success: false, error: 'Missing Facebook credentials' })
    }

    let result

    if (mediaUrls && mediaUrls.length > 0) {
      // Photo post
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: mediaUrls[0],
            message: content,
            access_token: pageToken,
          }),
        }
      )
      result = await res.json()
    } else {
      // Text-only post
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            access_token: pageToken,
          }),
        }
      )
      result = await res.json()
    }

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message })
    }

    return NextResponse.json({ success: true, platformPostId: result.id || result.post_id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message })
  }
}
