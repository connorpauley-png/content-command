import { PublishResult } from './types'

const IG_ACCOUNT_ID = process.env.IG_ACCOUNT_ID || process.env.IG_ACCOUNT_ID!
const PAGE_TOKEN = process.env.FB_PAGE_TOKEN || ''

async function createContainer(accountId: string, token: string, params: Record<string, string>): Promise<string> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${accountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, access_token: token }),
  })
  const data = await res.json()
  if (!data.id) throw new Error(data.error?.message || 'Container creation failed')
  return data.id
}

async function publishContainer(accountId: string, token: string, containerId: string): Promise<PublishResult> {
  const res = await fetch(`https://graph.facebook.com/v21.0/${accountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: containerId, access_token: token }),
  })
  const data = await res.json()
  if (data.id) {
    return { success: true, postId: data.id, postUrl: `https://instagram.com/your_handle` }
  }
  return { success: false, error: data.error?.message || 'IG publish failed' }
}

export async function publishToInstagram(content: string, photoUrls: string[]): Promise<PublishResult> {
  try {
    console.log(`[Instagram] Publishing @your_handle (${photoUrls.length} photos)`)

    if (photoUrls.length === 0) {
      return { success: false, error: 'Instagram requires at least one image' }
    }

    if (photoUrls.length === 1) {
      const containerId = await createContainer(IG_ACCOUNT_ID, PAGE_TOKEN, {
        image_url: photoUrls[0],
        caption: content,
      })
      const result = await publishContainer(IG_ACCOUNT_ID, PAGE_TOKEN, containerId)
      console.log(`[Instagram] Result:`, result)
      return result
    }

    // Carousel (2-10 images)
    const childIds: string[] = []
    for (const url of photoUrls.slice(0, 10)) {
      const childId = await createContainer(IG_ACCOUNT_ID, PAGE_TOKEN, {
        image_url: url,
        is_carousel_item: 'true',
      })
      childIds.push(childId)
    }

    const carouselId = await createContainer(IG_ACCOUNT_ID, PAGE_TOKEN, {
      media_type: 'CAROUSEL',
      caption: content,
      children: childIds.join(','),
    })

    const result = await publishContainer(IG_ACCOUNT_ID, PAGE_TOKEN, carouselId)
    console.log(`[Instagram] Carousel result:`, result)
    return result
  } catch (e) {
    console.error(`[Instagram] Exception: ${e}`)
    return { success: false, error: `Instagram exception: ${e}` }
  }
}
