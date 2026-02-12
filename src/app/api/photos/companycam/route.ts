import { NextRequest, NextResponse } from 'next/server'

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_TOKEN!
const COMPANYCAM_BASE = 'https://api.companycam.com/v2'

// Single consolidated CompanyCam photos proxy
// GET /api/photos/companycam?project_id=xxx&limit=20&page=1
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id') || searchParams.get('projectId')
  const limit = searchParams.get('limit') || searchParams.get('per_page') || '20'
  const page = searchParams.get('page') || '1'

  try {
    let url: string
    if (projectId) {
      url = `${COMPANYCAM_BASE}/projects/${projectId}/photos?per_page=${limit}&page=${page}`
    } else {
      url = `${COMPANYCAM_BASE}/photos?per_page=${limit}&page=${page}&sort=created_at&order=desc`
    }

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${COMPANYCAM_TOKEN}` },
      next: { revalidate: 300 }, // Cache 5 minutes
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `CompanyCam API error: ${res.status}` },
        { status: res.status }
      )
    }

    const photos = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const simplified = photos.map((p: any) => ({
      id: p.id,
      url: p.uris?.find?.((u: any) => u.type === 'original')?.uri
        || p.uris?.original || p.uris?.large || p.uris?.[0]?.uri,
      thumbnail: p.uris?.find?.((u: any) => u.type === 'thumbnail')?.uri
        || p.uris?.thumbnail || p.uris?.small || p.uris?.[0]?.uri,
      project_id: p.project_id || p.project?.id,
      project_name: p.project?.name,
      captured_at: p.captured_at,
      created_at: p.created_at,
    }))

    return NextResponse.json({ photos: simplified })
  } catch (error) {
    console.error('CompanyCam error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}
