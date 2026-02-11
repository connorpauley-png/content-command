import { NextRequest, NextResponse } from 'next/server';
import { matchPhotos, generateCaption, ANALYSIS_PROMPT, PhotoAnalysis } from '@/lib/fingerprint-matcher';
import { supabaseAdmin } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const supabase = supabaseAdmin;

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_TOKEN || '';

/**
 * POST /api/match
 * 
 * Body: { projectId: string } or { photos: PhotoAnalysis[] }
 * 
 * If projectId provided: fetches photos and returns them for analysis
 * If photos provided: runs matching and returns pairs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mode 1: Get photos from project for analysis
    if (body.projectId && !body.photos) {
      const photos = await fetchProjectPhotos(body.projectId);
      return NextResponse.json({
        mode: 'analyze',
        projectId: body.projectId,
        photos,
        prompt: ANALYSIS_PROMPT,
        message: `Found ${photos.length} photos. Analyze each with the prompt and call back with results.`
      });
    }
    
    // Mode 2: Match analyzed photos
    if (body.photos && Array.isArray(body.photos)) {
      const photos = body.photos as PhotoAnalysis[];
      const pairs = matchPhotos(photos);
      
      return NextResponse.json({
        mode: 'match',
        pairs: pairs.map(pair => ({
          ...pair,
          suggestedCaption: generateCaption(pair)
        })),
        message: `Found ${pairs.length} matching pairs.`
      });
    }
    
    return NextResponse.json({ error: 'Provide projectId or photos array' }, { status: 400 });
    
  } catch (error) {
    console.error('Match API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function fetchProjectPhotos(projectId: string) {
  const response = await fetch(
    `https://api.companycam.com/v2/projects/${projectId}/photos?per_page=100`,
    {
      headers: { Authorization: `Bearer ${COMPANYCAM_TOKEN}` }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch photos from CompanyCam');
  }
  
  const photos = await response.json();
  
  return photos.map((p: any) => ({
    id: p.id,
    url: p.uris?.find((u: any) => u.type === 'original')?.uri,
    capturedAt: p.captured_at
  })).filter((p: any) => p.url);
}

/**
 * GET /api/match?projectId=xxx
 * 
 * Quick endpoint to get project photos for analysis
 */
export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }
  
  try {
    const photos = await fetchProjectPhotos(projectId);
    return NextResponse.json({
      projectId,
      count: photos.length,
      photos,
      prompt: ANALYSIS_PROMPT
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}
