import { NextRequest, NextResponse } from 'next/server'
import { getRecentPhotos } from '@/lib/companycam'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const perPage = parseInt(searchParams.get('per_page') || '20')

  try {
    const photos = await getRecentPhotos(perPage)
    return NextResponse.json(photos)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch photos'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
