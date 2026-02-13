export interface PublishResult {
  success: boolean
  postId?: string
  url?: string
  error?: string
}

const DEFAULT_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN || ''
const DEFAULT_PERSON_URN = process.env.LINKEDIN_PERSON_URN || ''

export async function publishToLinkedIn(
  text: string,
  mediaUrls?: string[],
  options?: { accessToken?: string; personUrn?: string; dryRun?: boolean }
): Promise<PublishResult> {
  const accessToken = options?.accessToken || DEFAULT_ACCESS_TOKEN
  const personUrn = options?.personUrn || DEFAULT_PERSON_URN

  if (options?.dryRun) {
    return { success: true, postId: 'dry-run-linkedin', url: 'https://linkedin.com/feed/dry-run' }
  }

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    }

    let mediaAsset: string | null = null

    if (mediaUrls && mediaUrls.length > 0) {
      const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST', headers,
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: personUrn,
            serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
          },
        }),
      })
      const registerData = await registerRes.json()
      if (!registerData.value) {
        return { success: false, error: 'Failed to register LinkedIn upload: ' + JSON.stringify(registerData) }
      }
      const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl
      mediaAsset = registerData.value.asset

      const imageRes = await fetch(mediaUrls[0])
      const imageBuffer = await imageRes.arrayBuffer()
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/octet-stream' },
        body: imageBuffer,
      })
      if (!uploadRes.ok) {
        return { success: false, error: 'Failed to upload image to LinkedIn' }
      }
    }

    const postBody = {
      author: personUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: mediaAsset ? 'IMAGE' : 'NONE',
          ...(mediaAsset ? { media: [{ status: 'READY', media: mediaAsset }] } : {}),
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST', headers, body: JSON.stringify(postBody),
    })

    if (!postRes.ok) {
      return { success: false, error: `LinkedIn API error ${postRes.status}: ${await postRes.text()}` }
    }

    const postId = postRes.headers.get('x-restli-id') || 'unknown'
    return { success: true, postId, url: `https://linkedin.com/feed/update/${postId}` }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
