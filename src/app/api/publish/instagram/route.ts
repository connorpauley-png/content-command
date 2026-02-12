import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { content, mediaUrls, igAccountId, pageToken } = await req.json()

    if (!igAccountId || !pageToken) {
      return NextResponse.json({ success: false, error: 'Missing Instagram credentials' })
    }

    // Instagram requires an image
    if (!mediaUrls || mediaUrls.length === 0) {
      return NextResponse.json({ success: false, error: 'Instagram requires at least one image' })
    }

    const imageUrl = mediaUrls[0]

    // Step 1: Create media container
    const createRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: content,
          access_token: pageToken,
        }),
      }
    )
    const createData = await createRes.json()

    if (createData.error) {
      return NextResponse.json({ success: false, error: createData.error.message })
    }

    const creationId = createData.id

    // Step 2: Publish the container
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: pageToken,
        }),
      }
    )
    const publishData = await publishRes.json()

    if (publishData.error) {
      return NextResponse.json({ success: false, error: publishData.error.message })
    }

    return NextResponse.json({ success: true, platformPostId: publishData.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message })
  }
}
