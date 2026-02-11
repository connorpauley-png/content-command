import { PublishResult } from './types'

const IG_PERSONAL_ACCOUNT_ID = process.env.IG_PERSONAL_ACCOUNT_ID || process.env.IG_PERSONAL_ACCOUNT_ID!
const PAGE_TOKEN = process.env.IG_PERSONAL_PAGE_TOKEN || ''

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
    return { success: true, postId: data.id, postUrl: `https://instagram.com/your_ig_handle` }
  }
  return { success: false, error: data.error?.message || 'IG personal publish failed' }
}

export async function publishToInstagramPersonal(content: string, photoUrls: string[]): Promise<PublishResult> {
  try {
    console.log(`[Instagram Personal] Publishing @your_ig_handle (${photoUrls.length} photos)`)

    if (photoUrls.length === 0) {
      return { success: false, error: 'Instagram requires at least one image' }
    }

    if (photoUrls.length === 1) {
      const containerId = await createContainer(IG_PERSONAL_ACCOUNT_ID, PAGE_TOKEN, {
        image_url: photoUrls[0],
        caption: content,
      })
      const result = await publishContainer(IG_PERSONAL_ACCOUNT_ID, PAGE_TOKEN, containerId)
      console.log(`[Instagram Personal] Result:`, result)
      return result
    }

    // Carousel
    const childIds: string[] = []
    for (const url of photoUrls.slice(0, 10)) {
      const childId = await createContainer(IG_PERSONAL_ACCOUNT_ID, PAGE_TOKEN, {
        image_url: url,
        is_carousel_item: 'true',
      })
      childIds.push(childId)
    }

    const carouselId = await createContainer(IG_PERSONAL_ACCOUNT_ID, PAGE_TOKEN, {
      media_type: 'CAROUSEL',
      caption: content,
      children: childIds.join(','),
    })

    const result = await publishContainer(IG_PERSONAL_ACCOUNT_ID, PAGE_TOKEN, carouselId)
    console.log(`[Instagram Personal] Carousel result:`, result)
    return result
  } catch (e) {
    console.error(`[Instagram Personal] Exception: ${e}`)
    return { success: false, error: `Instagram personal exception: ${e}` }
  }
}
