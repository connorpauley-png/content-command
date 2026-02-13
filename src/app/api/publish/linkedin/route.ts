import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { content, mediaUrls, accessToken, personUrn } = await req.json()

    if (!accessToken || !personUrn) {
      return NextResponse.json({ success: false, error: 'Missing LinkedIn credentials' })
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    }

    let mediaAsset: string | null = null

    // If we have images, register and upload
    if (mediaUrls && mediaUrls.length > 0) {
      // Step 1: Register upload
      const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: personUrn,
            serviceRelationships: [
              { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' },
            ],
          },
        }),
      })
      const registerData = await registerRes.json()

      if (!registerData.value) {
        return NextResponse.json({ success: false, error: 'Failed to register LinkedIn upload: ' + JSON.stringify(registerData) })
      }

      const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
      mediaAsset = registerData.value.asset

      // Step 2: Download image and upload to LinkedIn
      const imageRes = await fetch(mediaUrls[0])
      const imageBuffer = await imageRes.arrayBuffer()

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream',
        },
        body: imageBuffer,
      })

      if (!uploadRes.ok) {
        return NextResponse.json({ success: false, error: 'Failed to upload image to LinkedIn' })
      }
    }

    // Step 3: Create the post
    const postBody: Record<string, unknown> = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: mediaAsset ? 'IMAGE' : 'NONE',
          ...(mediaAsset
            ? {
                media: [
                  {
                    status: 'READY',
                    media: mediaAsset,
                  },
                ],
              }
            : {}),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers,
      body: JSON.stringify(postBody),
    })

    if (!postRes.ok) {
      const errText = await postRes.text()
      return NextResponse.json({ success: false, error: `LinkedIn API error ${postRes.status}: ${errText}` })
    }

    const postId = postRes.headers.get('x-restli-id') || 'unknown'
    return NextResponse.json({ success: true, platformPostId: postId })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message })
  }
}
