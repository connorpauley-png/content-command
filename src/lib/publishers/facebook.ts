import { PublishResult } from './types'

const PAGE_ID = process.env.FB_PAGE_ID || process.env.FB_PAGE_ID!
const PAGE_TOKEN = process.env.FB_PAGE_TOKEN || ''

export async function publishToFacebook(content: string, photoUrls: string[]): Promise<PublishResult> {
  try {
    console.log(`[Facebook] Publishing (${content.length} chars, ${photoUrls.length} photos)`)

    if (photoUrls.length === 0) {
      // Text-only post
      const res = await fetch(`https://graph.facebook.com/v21.0/${PAGE_ID}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ message: content, access_token: PAGE_TOKEN }),
      })
      const data = await res.json()
      if (data.id) {
        console.log(`[Facebook] Published text post: ${data.id}`)
        return { success: true, postId: data.id, postUrl: `https://facebook.com/${data.id}` }
      }
      console.error(`[Facebook] Error: ${data.error?.message}`)
      return { success: false, error: data.error?.message || 'Facebook post failed' }
    }

    if (photoUrls.length === 1) {
      // Single photo
      const res = await fetch(`https://graph.facebook.com/v21.0/${PAGE_ID}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ url: photoUrls[0], caption: content, access_token: PAGE_TOKEN }),
      })
      const data = await res.json()
      if (data.id) {
        console.log(`[Facebook] Published photo post: ${data.id}`)
        return { success: true, postId: data.id }
      }
      console.error(`[Facebook] Error: ${data.error?.message}`)
      return { success: false, error: data.error?.message || 'Facebook photo post failed' }
    }

    // Multi-photo: upload each unpublished, then create feed post with attached_media
    const photoIds: string[] = []
    for (const url of photoUrls) {
      const res = await fetch(`https://graph.facebook.com/v21.0/${PAGE_ID}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ url, published: 'false', access_token: PAGE_TOKEN }),
      })
      const data = await res.json()
      if (data.id) photoIds.push(data.id)
    }

    if (photoIds.length === 0) {
      return { success: false, error: 'Failed to upload any photos to Facebook' }
    }

    const feedBody = new URLSearchParams({ message: content, access_token: PAGE_TOKEN })
    photoIds.forEach((id, i) => feedBody.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id })))

    const res = await fetch(`https://graph.facebook.com/v21.0/${PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: feedBody,
    })
    const data = await res.json()
    if (data.id) {
      console.log(`[Facebook] Published multi-photo post: ${data.id}`)
      return { success: true, postId: data.id, postUrl: `https://facebook.com/${data.id}` }
    }
    console.error(`[Facebook] Error: ${data.error?.message}`)
    return { success: false, error: data.error?.message || 'Facebook multi-photo post failed' }
  } catch (e) {
    console.error(`[Facebook] Exception: ${e}`)
    return { success: false, error: `Facebook exception: ${e}` }
  }
}
