/* eslint-disable @typescript-eslint/no-explicit-any */
// Photo-first content generation
// Scans CompanyCam, analyzes photos with vision AI, generates captions

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_TOKEN!
const COMPANYCAM_BASE = 'https://api.companycam.com/v2'

export type PhotoAnalysis = {
  photoId: string
  photoUrl: string
  thumbnailUrl: string
  projectName: string
  projectAddress: string
  takenAt: string
  analysis: {
    scene: string           // "before cleanup", "after mulching", "crew working", etc.
    quality: number         // 1-10 social media worthiness
    postType: string        // "before-after", "transformation", "crew", "satisfying", "tip"
    platforms: string[]     // recommended platforms
    caption: string         // generated caption
    hashtags: string[]      // relevant hashtags
  }
  alreadyUsed: boolean
}

export type CCPhoto = {
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
  coordinates?: { lat: number; lon: number }
}

// Fetch recent photos from CompanyCam
export async function fetchRecentPhotos(limit = 20): Promise<CCPhoto[]> {
  const res = await fetch(
    `${COMPANYCAM_BASE}/photos?per_page=${limit}&sort=captured_at&direction=desc`,
    {
      headers: {
        Authorization: `Bearer ${COMPANYCAM_TOKEN}`,
        Accept: 'application/json',
      },
    }
  )

  if (!res.ok) {
    throw new Error(`CompanyCam API error: ${res.status}`)
  }

  return res.json()
}

// Get photo URL by size
export function getPhotoUrl(photo: CCPhoto, size: 'thumbnail' | 'web' | 'original' = 'web'): string {
  const uri = photo.uris.find((u) => u.type === size) || photo.uris[0]
  return uri?.uri || ''
}

// Check if photo has already been used in a post
export async function isPhotoUsed(photoUrl: string, supabase: any): Promise<boolean> {
  const { data } = await supabase
    .from('cc_posts')
    .select('id')
    .contains('photo_urls', [photoUrl])
    .limit(1)

  return (data?.length || 0) > 0
}

// Analyze a photo with vision AI and generate caption
export async function analyzePhoto(
  photoUrl: string,
  projectName: string,
  projectAddress: string
): Promise<PhotoAnalysis['analysis']> {
  // Use Claude vision via OpenClaw's image analysis
  // For now, we'll call our own API endpoint that wraps this
  
  const prompt = `Analyze this landscaping/outdoor service job site photo for social media posting.

Project: ${projectName}
Location: ${projectAddress}

Evaluate and respond in JSON format:
{
  "scene": "brief description of what's shown (e.g., 'freshly mulched flower beds', 'crew edging sidewalk', 'before shot of overgrown yard')",
  "quality": 1-10 rating for social media (10 = stunning transformation, 1 = blurry/unusable),
  "postType": one of ["before-after", "transformation", "crew", "satisfying", "tip", "testimonial", "equipment", "weather"],
  "platforms": ["instagram", "facebook"] - which platforms this photo works best for,
  "caption": "A natural, friendly caption for College Bros Outdoor Services. No emojis. Include (318) 600-9123 if appropriate. Voice: helpful neighbor who runs a great company.",
  "hashtags": ["MonroeLA", "LawnCare", etc] - max 6, hyperlocal + service relevant
}

Quality guidelines:
- 8-10: Clear, well-composed, shows impressive work or likeable crew
- 5-7: Decent, usable but not standout
- 1-4: Blurry, bad angle, not post-worthy

Caption voice: friendly, real, no corporate speak, no emojis.`

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3034'
    const res = await fetch(`${baseUrl}/api/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: photoUrl, prompt }),
    })

    if (!res.ok) {
      throw new Error('Vision API failed')
    }

    const data = await res.json()
    
    // Parse the JSON response from the AI
    const jsonMatch = data.analysis?.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    // Fallback if parsing fails
    return {
      scene: 'Job site photo',
      quality: 5,
      postType: 'transformation',
      platforms: ['instagram', 'facebook'],
      caption: 'Another day, another yard transformed. Call us at (318) 600-9123.',
      hashtags: ['MonroeLA', 'LawnCare', 'CollegeBros'],
    }
  } catch (e) {
    console.error('Photo analysis failed:', e)
    return {
      scene: 'Job site photo',
      quality: 5,
      postType: 'transformation',
      platforms: ['instagram', 'facebook'],
      caption: 'Another day, another yard transformed. Call us at (318) 600-9123.',
      hashtags: ['MonroeLA', 'LawnCare', 'CollegeBros'],
    }
  }
}

// Scan recent photos and return analyzed, unused ones
export async function scanForContent(
  supabase: any,
  limit = 10
): Promise<PhotoAnalysis[]> {
  const photos = await fetchRecentPhotos(30)
  const results: PhotoAnalysis[] = []

  for (const photo of photos) {
    if (results.length >= limit) break

    const webUrl = getPhotoUrl(photo, 'web')
    const thumbUrl = getPhotoUrl(photo, 'thumbnail')

    // Skip if already used
    const used = await isPhotoUsed(webUrl, supabase)
    if (used) continue

    // Get project details
    const projectName = photo.project?.name || 'Job Site'
    const addr = photo.project?.address
    const projectAddress = addr
      ? `${addr.street_address_1 || ''}, ${addr.city || ''} ${addr.state || ''}`.trim()
      : 'Monroe, LA'

    // Analyze with vision AI
    const analysis = await analyzePhoto(webUrl, projectName, projectAddress)

    // Only include if quality >= 6
    if (analysis.quality >= 6) {
      results.push({
        photoId: photo.id,
        photoUrl: webUrl,
        thumbnailUrl: thumbUrl,
        projectName,
        projectAddress,
        takenAt: new Date(photo.captured_at * 1000).toISOString(),
        analysis,
        alreadyUsed: false,
      })
    }
  }

  return results
}

// Match existing post content to best CompanyCam photos
export async function findPhotosForPost(
  postContent: string,
  supabase: any,
  limit = 5
): Promise<{ photoUrl: string; thumbnailUrl: string; relevance: string }[]> {
  const photos = await fetchRecentPhotos(50)
  const matches: { photoUrl: string; thumbnailUrl: string; relevance: string; score: number }[] = []

  // Extract keywords from post content
  const contentLower = postContent.toLowerCase()
  const keywords = {
    mulch: ['mulch', 'bed', 'flower'],
    lawn: ['lawn', 'mow', 'grass', 'turf', 'edge'],
    pressure: ['pressure', 'wash', 'clean', 'driveway', 'sidewalk'],
    tree: ['tree', 'branch', 'storm', 'debris', 'removal'],
    crew: ['crew', 'team', 'guys', 'employees'],
    spring: ['spring', 'cleanup', 'seasonal'],
  }

  for (const photo of photos) {
    const webUrl = getPhotoUrl(photo, 'web')
    const thumbUrl = getPhotoUrl(photo, 'thumbnail')
    const projectName = (photo.project?.name || '').toLowerCase()

    // Simple keyword matching (could enhance with vision AI later)
    let score = 0
    let relevance = ''

    for (const [category, words] of Object.entries(keywords)) {
      const matchesContent = words.some((w) => contentLower.includes(w))
      const matchesProject = words.some((w) => projectName.includes(w))

      if (matchesContent && matchesProject) {
        score += 2
        relevance = category
      } else if (matchesContent || matchesProject) {
        score += 1
        if (!relevance) relevance = category
      }
    }

    if (score > 0) {
      matches.push({ photoUrl: webUrl, thumbnailUrl: thumbUrl, relevance, score })
    }
  }

  // Sort by score, return top matches
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ photoUrl, thumbnailUrl, relevance }) => ({ photoUrl, thumbnailUrl, relevance }))
}
