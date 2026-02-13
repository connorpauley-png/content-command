export interface PublishResult {
  success: boolean
  postId?: string
  url?: string
  error?: string
}

export async function publishToInstagram(
  caption: string,
  imageUrl: string,
  igAccountId: string,
  pageToken: string,
  options?: { dryRun?: boolean }
): Promise<PublishResult> {
  if (options?.dryRun) {
    return { success: true, postId: 'dry-run-instagram', url: `https://instagram.com/p/dry-run` }
  }

  try {
    // Step 1: Create media container
    const createRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: pageToken }),
    })
    const createData = await createRes.json()

    if (createData.error) {
      return { success: false, error: createData.error.message }
    }

    // Step 2: Publish the container
    const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: createData.id, access_token: pageToken }),
    })
    const publishData = await publishRes.json()

    if (publishData.error) {
      return { success: false, error: publishData.error.message }
    }

    return { success: true, postId: publishData.id, url: `https://instagram.com/p/${publishData.id}` }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
