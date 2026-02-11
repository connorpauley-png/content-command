import { NextResponse } from 'next/server'

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_TOKEN!
const COMPANYCAM_API = 'https://api.companycam.com/v2'

export async function GET() {
  try {
    const res = await fetch(`${COMPANYCAM_API}/projects?per_page=100&sort=-created_at`, {
      headers: {
        'Authorization': `Bearer ${COMPANYCAM_TOKEN}`,
      },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: res.status })
    }

    const projects = await res.json()
    
    // Map to simpler format
    const mapped = projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      photo_count: p.photo_count,
      created_at: p.created_at,
    }))

    return NextResponse.json({ projects: mapped })
  } catch (error) {
    console.error('CompanyCam projects error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
