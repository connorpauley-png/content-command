import { PublishResult } from './types'

const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN || ''
const PERSON_URN = process.env.LINKEDIN_PERSON_URN || process.env.LINKEDIN_PERSON_URN!

async function uploadImage(photoUrl: string): Promise<string | null> {
  try {
    // Step 1: Initialize upload
    const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
      },
      body: JSON.stringify({ initializeUploadRequest: { owner: PERSON_URN } }),
    })

    if (!initRes.ok) return null
    const initData = await initRes.json()
    const uploadUrl = initData.value?.uploadUrl
    const imageUrn = initData.value?.image
    if (!uploadUrl || !imageUrn) return null

    // Step 2: Download and upload binary
    const imgRes = await fetch(photoUrl)
    if (!imgRes.ok) return null
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imgBuffer,
    })

    if (!uploadRes.ok) return null
    return imageUrn
  } catch {
    return null
  }
}

export async function publishToLinkedIn(content: string, photoUrls: string[]): Promise<PublishResult> {
  try {
    console.log(`[LinkedIn] Publishing (${content.length} chars, ${photoUrls.length} photos)`)

    // Upload first image if provided
    let imageUrn: string | null = null
    if (photoUrls.length > 0) {
      imageUrn = await uploadImage(photoUrls[0])
    }

    const postBody: Record<string, unknown> = {
      author: PERSON_URN,
      commentary: content,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
    }

    if (imageUrn) {
      postBody.content = {
        media: { title: 'Photo', id: imageUrn },
      }
    }

    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
      },
      body: JSON.stringify(postBody),
    })

    if (res.status === 201) {
      const postId = res.headers.get('x-restli-id') || ''
      console.log(`[LinkedIn] Published: ${postId}`)
      return { success: true, postId }
    }

    const data = await res.json().catch(() => ({}))
    const error = (data as Record<string, string>).message || `LinkedIn ${res.status}`
    console.error(`[LinkedIn] Error: ${error}`)
    return { success: false, error }
  } catch (e) {
    console.error(`[LinkedIn] Exception: ${e}`)
    return { success: false, error: `LinkedIn exception: ${e}` }
  }
}
