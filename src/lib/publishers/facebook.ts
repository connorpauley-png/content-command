export interface PublishResult {
  success: boolean
  postId?: string
  url?: string
  error?: string
}

export async function publishToFacebook(
  text: string,
  pageId: string,
  pageToken: string,
  mediaUrls?: string[],
  options?: { dryRun?: boolean }
): Promise<PublishResult> {
  if (options?.dryRun) {
    return { success: true, postId: 'dry-run-facebook', url: `https://facebook.com/${pageId}/posts/dry-run` }
  }

  try {
    let result: Record<string, unknown>

    if (mediaUrls && mediaUrls.length > 0) {
      const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mediaUrls[0], message: text, access_token: pageToken }),
      })
      result = await res.json()
    } else {
      const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, access_token: pageToken }),
      })
      result = await res.json()
    }

    if (result.error) {
      return { success: false, error: (result.error as Record<string, string>).message }
    }

    const id = (result.id || result.post_id) as string
    return { success: true, postId: id, url: `https://facebook.com/${id}` }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
