import { NextRequest, NextResponse } from 'next/server'
import { getProjectPhotos } from '@/lib/companycam'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('per_page') || '20')

  try {
    const photos = await getProjectPhotos(params.projectId, page, perPage)
    return NextResponse.json(photos)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch project photos'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
