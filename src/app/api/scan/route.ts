/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Scan CompanyCam for post-worthy photos
// Returns analyzed photos with auto-generated captions

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_TOKEN!
const COMPANYCAM_BASE = 'https://api.companycam.com/v2'

type CCPhoto = {
  id: string
  captured_at: number
  uris: { type: string; uri: string }[]
  project: {
    id: string
    name: string
    address?: {
      street_address_1?: string
      city?: string
      state?: string
    }
  }
  creator_name?: string
}

function getPhotoUrl(photo: CCPhoto, size: 'thumbnail' | 'web' | 'original' = 'web'): string {
  const uri = photo.uris.find((u) => u.type === size) || photo.uris[0]
  return uri?.uri || ''
}

async function analyzeWithVision(photoUrl: string, projectName: string, address: string): Promise<any> {
  const prompt = `Analyze this landscaping/outdoor service job site photo for social media.

Project: ${projectName}
Location: ${address}

Return JSON only:
{
  "scene": "brief description (e.g., 'freshly mulched beds', 'crew edging lawn', 'before shot of overgrown yard')",
  "quality": 1-10 (10=stunning, 1=unusable),
  "postType": "before-after" | "transformation" | "crew" | "satisfying" | "equipment",
  "platforms": ["instagram", "facebook"],
  "caption": "Natural friendly caption for Your Business. No emojis. Include (555) 000-0000 for service posts.",
  "hashtags": ["MonroeLA", "LawnCare"] max 6
}

Quality: 8-10 clear/impressive, 5-7 decent, 1-4 skip.
Voice: friendly neighbor who runs a great company.`

  try {
    // Try local vision endpoint first
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3034'}/api/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: photoUrl, prompt }),
    })

    if (res.ok) {
      const data = await res.json()
      const jsonMatch = data.analysis?.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }
  } catch (e) {
    console.error('Vision analysis failed:', e)
  }

  // Fallback: generate based on project name keywords
  const nameLower = projectName.toLowerCase()
  let postType = 'transformation'
  let scene = 'Job site work'

  if (nameLower.includes('mulch') || nameLower.includes('bed')) {
    postType = 'transformation'
    scene = 'Fresh mulch installation'
  } else if (nameLower.includes('clean') || nameLower.includes('pressure')) {
    postType = 'satisfying'
    scene = 'Pressure washing results'
  } else if (nameLower.includes('storm') || nameLower.includes('tree')) {
    postType = 'before-after'
    scene = 'Storm cleanup'
  }

  return {
    scene,
    quality: 7,
    postType,
    platforms: ['instagram', 'facebook'],
    caption: `Another property taken care of in ${address.split(',')[1]?.trim() || 'Monroe'}. This is what we do. Call or text (555) 000-0000 if your yard needs attention.`,
    hashtags: ['MonroeLA', 'LawnCare', 'Landscaping', 'YourBrand', 'WestMonroe'],
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const minQuality = parseInt(searchParams.get('minQuality') || '6')

  try {
    // Fetch recent photos
    const photosRes = await fetch(
      `${COMPANYCAM_BASE}/photos?per_page=50&sort=captured_at&direction=desc`,
      {
        headers: {
          Authorization: `Bearer ${COMPANYCAM_TOKEN}`,
          Accept: 'application/json',
        },
      }
    )

    if (!photosRes.ok) {
      return NextResponse.json({ error: 'CompanyCam API failed' }, { status: 500 })
    }

    const photos: CCPhoto[] = await photosRes.json()

    // Get already-used photo URLs
    const { data: existingPosts } = await supabaseAdmin
      .from('cc_posts')
      .select('photo_urls')
      .not('photo_urls', 'is', null)

    const usedUrls = new Set<string>()
    for (const post of existingPosts || []) {
      for (const url of post.photo_urls || []) {
        usedUrls.add(url)
      }
    }

    // Analyze unused photos
    const results: any[] = []

    for (const photo of photos) {
      if (results.length >= limit) break

      const webUrl = getPhotoUrl(photo, 'web')
      const thumbUrl = getPhotoUrl(photo, 'thumbnail')

      // Skip if already used
      if (usedUrls.has(webUrl)) continue

      const projectName = photo.project?.name || 'Job Site'
      const addr = photo.project?.address
      const address = addr
        ? `${addr.street_address_1 || ''}, ${addr.city || ''} ${addr.state || ''}`.trim().replace(/^,\s*/, '')
        : 'Monroe, LA'

      // Analyze photo
      const analysis = await analyzeWithVision(webUrl, projectName, address)

      // Skip low quality
      if (analysis.quality < minQuality) continue

      results.push({
        photoId: photo.id,
        photoUrl: webUrl,
        thumbnailUrl: thumbUrl,
        projectName,
        address,
        takenAt: new Date(photo.captured_at * 1000).toISOString(),
        creatorName: photo.creator_name,
        ...analysis,
      })
    }

    return NextResponse.json({
      scanned: photos.length,
      found: results.length,
      photos: results,
    })
  } catch (e) {
    console.error('Scan error:', e)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}

// POST: Create posts from scanned photos
export async function POST(request: NextRequest) {
  const { photos } = await request.json()

  if (!photos || !Array.isArray(photos) || photos.length === 0) {
    return NextResponse.json({ error: 'photos array required' }, { status: 400 })
  }

  const created: string[] = []
  const errors: string[] = []

  for (const photo of photos) {
    try {
      // Format caption with hashtags
      const hashtags = (photo.hashtags || []).map((h: string) => `#${h}`).join(' ')
      const content = `${photo.caption}\n\n${hashtags}`

      const { data, error } = await supabaseAdmin
        .from('cc_posts')
        .insert({
          content,
          platforms: photo.platforms || ['instagram', 'facebook'],
          photo_urls: [photo.photoUrl],
          status: 'idea', // Goes to Ideas column for review
          tags: [photo.postType, 'auto-scanned'],
          notes: `Auto-generated from CompanyCam: ${photo.projectName}`,
        })
        .select()
        .single()

      if (error) {
        errors.push(`${photo.photoId}: ${error.message}`)
      } else {
        created.push(data.id)
      }
    } catch (e) {
      errors.push(`${photo.photoId}: ${e}`)
    }
  }

  return NextResponse.json({
    created: created.length,
    errors: errors.length,
    postIds: created,
    errorDetails: errors,
  })
}
