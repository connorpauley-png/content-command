import { NextRequest, NextResponse } from 'next/server';

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_TOKEN!;

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') || '50';
    
    const response = await fetch(
      `https://api.companycam.com/v2/projects?per_page=${limit}`,
      {
        headers: { Authorization: `Bearer ${COMPANYCAM_TOKEN}` }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    
    const projects = await response.json();
    
    return NextResponse.json({
      projects: projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        photo_count: p.photo_count || 0
      }))
    });
    
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
