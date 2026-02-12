import { NextRequest, NextResponse } from 'next/server';

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_TOKEN!;

/**
 * POST /api/build
 * 
 * Scans a project for before/after pairs
 * 
 * Note: Full vision analysis requires external API call.
 * This endpoint returns photos for manual analysis or uses cached results.
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId, projectName } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }
    
    // Fetch photos from project
    const response = await fetch(
      `https://api.companycam.com/v2/projects/${projectId}/photos?per_page=100`,
      {
        headers: { Authorization: `Bearer ${COMPANYCAM_TOKEN}` }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch photos');
    }
    
    const photos = await response.json();
    
    // Extract photo data
    const photoData = photos.map((p: any) => ({
      id: p.id,
      url: p.uris?.find((u: any) => u.type === 'original')?.uri,
      capturedAt: p.captured_at
    })).filter((p: any) => p.url);
    
    // Check for pre-tagged "Before and After" photos
    const taggedResponse = await fetch(
      `https://api.companycam.com/v2/photos?per_page=100&tag_ids[]=16664744`,
      {
        headers: { Authorization: `Bearer ${COMPANYCAM_TOKEN}` }
      }
    );
    
    let preTaggedPairs: any[] = [];
    
    if (taggedResponse.ok) {
      const taggedPhotos = await taggedResponse.json();
      const projectTagged = taggedPhotos.filter((p: any) => p.project_id === projectId);
      
      // Pre-tagged photos are often already combined before/after images
      preTaggedPairs = projectTagged.map((p: any) => ({
        before: {
          id: p.id,
          url: p.uris?.find((u: any) => u.type === 'original')?.uri,
          messy: 10  // Pre-tagged, assume valid
        },
        after: {
          id: p.id + '_after',
          url: p.uris?.find((u: any) => u.type === 'original')?.uri,
          clean: 10
        },
        fingerprint: 'Pre-tagged before/after image',
        caption: 'The transformation speaks for itself.',
        isPreCombined: true  // Flag that this is already a combined image
      }));
    }
    
    return NextResponse.json({
      projectId,
      projectName,
      photoCount: photoData.length,
      photos: photoData,
      pairs: preTaggedPairs,
      message: preTaggedPairs.length > 0 
        ? `Found ${preTaggedPairs.length} pre-tagged before/after photos`
        : `Found ${photoData.length} photos. Vision analysis needed to find pairs.`,
      needsAnalysis: preTaggedPairs.length === 0
    });
    
  } catch (error) {
    console.error('Build API error:', error);
    return NextResponse.json({ error: 'Failed to scan project' }, { status: 500 });
  }
}
