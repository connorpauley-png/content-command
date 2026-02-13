import { NextResponse } from 'next/server'

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_API_TOKEN || ''
const COMPANYCAM_BASE = 'https://api.companycam.com/v2'

function extractPhotoUrl(photo: Record<string, unknown>): { url: string; thumbnailUrl: string } {
  const uris = photo.uris as Array<{ type: string; uri: string }> | undefined
  let url = ''
  let thumbnailUrl = ''
  if (uris && Array.isArray(uris)) {
    const photoUri = uris.find(u => u.type === 'photo_url') || uris.find(u => u.type === 'original') || uris[0]
    const thumbUri = uris.find(u => u.type === 'thumb_url') || uris.find(u => u.type === 'thumbnail') || photoUri
    url = photoUri?.uri || ''
    thumbnailUrl = thumbUri?.uri || url
  }
  return { url, thumbnailUrl }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const projectId = searchParams.get('projectId')
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  try {
    let apiUrl: string
    if (projectId) {
      apiUrl = `${COMPANYCAM_BASE}/projects/${projectId}/photos?per_page=${limit}`
    } else if (q) {
      apiUrl = `${COMPANYCAM_BASE}/photos?search=${encodeURIComponent(q)}&per_page=${limit}`
    } else {
      apiUrl = `${COMPANYCAM_BASE}/photos?per_page=${limit}`
    }

    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${COMPANYCAM_TOKEN}` },
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `CompanyCam API error: ${err}` }, { status: res.status })
    }

    const photos = await res.json()
    const results = (Array.isArray(photos) ? photos : []).map((photo: Record<string, unknown>) => {
      const { url, thumbnailUrl } = extractPhotoUrl(photo)
      return {
        id: photo.id as string,
        url,
        thumbnailUrl,
        createdAt: photo.created_at as string,
        projectName: (photo.project as Record<string, unknown>)?.name as string || '',
      }
    })

    return NextResponse.json({ photos: results })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
