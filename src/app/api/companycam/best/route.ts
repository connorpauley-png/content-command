import { NextResponse } from 'next/server'
import { scorePhotos, type ScoredPhoto } from '@/lib/companycam-scorer'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      usedPhotoIds = [],
      serviceType,
      contentType,
      postContent,
      limit = 5,
    } = body as {
      usedPhotoIds?: string[]
      serviceType?: string
      contentType?: string
      postContent?: string
      limit?: number
    }

    const usedSet = new Set(usedPhotoIds)
    let photos: ScoredPhoto[] = await scorePhotos()

    photos = photos.filter((p) => !usedSet.has(p.photoId))

    if (serviceType) {
      const match = serviceType.toLowerCase()
      photos = photos.filter((p) => p.serviceType.toLowerCase().includes(match))
    }
    if (contentType) {
      const match = contentType.toLowerCase()
      photos = photos.filter((p) => p.contentType.toLowerCase().includes(match))
    }

    if (postContent) {
      const contentLower = postContent.toLowerCase()
      photos.sort((a, b) => {
        const aRelevant = contentLower.includes(a.serviceType.toLowerCase().replace('_', ' ')) ? 1 : 0
        const bRelevant = contentLower.includes(b.serviceType.toLowerCase().replace('_', ' ')) ? 1 : 0
        if (aRelevant !== bRelevant) return bRelevant - aRelevant
        return b.score - a.score
      })
    }

    return NextResponse.json({ photos: photos.slice(0, limit) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
