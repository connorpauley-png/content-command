import { NextResponse } from 'next/server'

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_TOKEN || process.env.COMPANYCAM_TOKEN!
const COMPANYCAM_BASE = 'https://api.companycam.com/v2'

// GET /api/photos/companycam/projects
export async function GET() {
  try {
    const res = await fetch(`${COMPANYCAM_BASE}/projects?per_page=100&sort=-created_at`, {
      headers: { 'Authorization': `Bearer ${COMPANYCAM_TOKEN}` },
      next: { revalidate: 300 }, // Cache 5 minutes
    })

    if (!res.ok) {
      return NextResponse.json({ error: `CompanyCam API error: ${res.status}` }, { status: res.status })
    }

    const projects = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const simplified = projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      address: p.address?.street_address_1,
      photo_count: p.photo_count,
      created_at: p.created_at,
    }))

    return NextResponse.json({ projects: simplified })
  } catch (error) {
    console.error('CompanyCam projects error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}
