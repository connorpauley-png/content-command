import { NextRequest, NextResponse } from 'next/server'
import { getIntegrations } from '@/lib/tenant'

const COMPANYCAM_API = 'https://api.companycam.com/v2'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '20')
  const projectId = searchParams.get('project_id')
  
  // Get CompanyCam integration
  const ccIntegration = getIntegrations('source').find(i => i.type === 'companycam')
  if (!ccIntegration || !ccIntegration.credentials.token) {
    return NextResponse.json({ error: 'CompanyCam not connected' }, { status: 400 })
  }
  
  const token = ccIntegration.credentials.token

  try {
    let url = `${COMPANYCAM_API}/photos?per_page=${limit}&sort=created_at`
    if (projectId) {
      url = `${COMPANYCAM_API}/projects/${projectId}/photos?per_page=${limit}`
    }

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    
    if (!res.ok) {
      throw new Error(`CompanyCam API error: ${res.status}`)
    }
    
    const photos = await res.json()
    
    // Transform to simpler format
    const simplified = photos.map((p: any) => ({
      id: p.id,
      url: p.uris?.find((u: any) => u.type === 'original')?.uri || p.uris?.[0]?.uri,
      thumbnail: p.uris?.find((u: any) => u.type === 'thumbnail')?.uri || p.uris?.[0]?.uri,
      project_id: p.project_id,
      captured_at: p.captured_at,
      created_at: p.created_at,
    }))
    
    return NextResponse.json({ photos: simplified })
  } catch (error) {
    console.error('CompanyCam error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch photos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
