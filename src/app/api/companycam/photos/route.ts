import { NextResponse } from 'next/server'

const API_TOKEN = process.env.COMPANYCAM_API_TOKEN || ''
const BASE_URL = 'https://api.companycam.com/v2'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')

  try {
    let url = `${BASE_URL}/photos?per_page=30&sort=created_at`
    if (projectId) {
      url = `${BASE_URL}/projects/${projectId}/photos?per_page=30&sort=created_at`
    }

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'CompanyCam API error' }, { status: res.status })
    }

    const photos = await res.json()

    // Also fetch projects for the filter dropdown
    let projects: { id: string; name: string }[] = []
    if (!projectId) {
      try {
        const projRes = await fetch(`${BASE_URL}/projects?per_page=50&sort=updated_at`, {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        })
        if (projRes.ok) {
          const projData = await projRes.json()
          projects = projData.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))
        }
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      photos: photos.map((p: { id: string; uris: Record<string, string>[]; created_at: string; project_id?: string }) => ({
        id: p.id,
        uri: p.uris?.[0]?.original_uri || p.uris?.[0]?.uri_base || '',
        thumbnail: p.uris?.[0]?.uri_base ? `${p.uris[0].uri_base}?w=200&h=200` : p.uris?.[0]?.original_uri || '',
        createdAt: p.created_at,
        projectId: p.project_id,
      })),
      projects,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
