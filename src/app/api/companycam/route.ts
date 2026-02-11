/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_TOKEN!
const COMPANYCAM_BASE = 'https://api.companycam.com/v2'

// Get recent photos from CompanyCam
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')
  const limit = searchParams.get('limit') || '20'

  try {
    let url = `${COMPANYCAM_BASE}/photos?per_page=${limit}&sort=created_at`
    if (projectId) {
      url = `${COMPANYCAM_BASE}/projects/${projectId}/photos?per_page=${limit}`
    }

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${COMPANYCAM_TOKEN}`,
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch photos' }, { status: res.status })
    }

    const photos = await res.json()
    
    // Transform to simpler format
    const simplified = photos.map((p: any) => ({
      id: p.id,
      url: p.uris?.original || p.uris?.large || p.uris?.medium,
      thumb: p.uris?.thumbnail || p.uris?.small,
      created_at: p.created_at,
      project_id: p.project_id,
    }))

    return NextResponse.json({ photos: simplified })
  } catch (error) {
    console.error('CompanyCam error:', error)
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}

// Get list of projects
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  if (body.action === 'projects') {
    try {
      const res = await fetch(`${COMPANYCAM_BASE}/projects?per_page=50&sort=updated_at`, {
        headers: {
          'Authorization': `Bearer ${COMPANYCAM_TOKEN}`,
        },
      })

      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: res.status })
      }

      const projects = await res.json()
      const simplified = projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        address: p.address?.street_address_1,
        photo_count: p.photo_count,
      }))

      return NextResponse.json({ projects: simplified })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
