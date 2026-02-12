import OpenAI from 'openai'

const API_TOKEN = process.env.COMPANYCAM_API_TOKEN || ''
const BASE_URL = 'https://api.companycam.com/v2'
const OPENAI_KEY = process.env.OPENAI_API_KEY || ''

const openai = new OpenAI({ apiKey: OPENAI_KEY })

export interface ScoredPhoto {
  photoId: string
  url: string
  thumbnail: string
  score: number
  contentType: string
  serviceType: string
  description: string
  projectName: string
}

interface CCPhoto {
  id: string
  uris: { type: string; uri: string; url: string }[]
  created_at: string
  project_id?: string
}

// Tag IDs for quality content
const QUALITY_TAGS = [
  '16664742', // Finished
  '16664744', // Before and After
  '17029741', // before
]

async function fetchRecentPhotos(): Promise<{ photos: CCPhoto[]; projectMap: Map<string, string> }> {
  // Fetch tagged photos first (Finished, Before and After) — these are the gold
  const taggedPhotos: CCPhoto[] = []
  for (const tagId of QUALITY_TAGS) {
    const tagRes = await fetch(`${BASE_URL}/photos?per_page=20&tag_ids[]=${tagId}`, {
      headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    })
    if (tagRes.ok) {
      const tagPhotos: CCPhoto[] = await tagRes.json()
      taggedPhotos.push(...tagPhotos)
    }
  }
  
  // Also get recent photos as fallback
  const res = await fetch(`${BASE_URL}/photos?per_page=20&sort=created_at`, {
    headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`CompanyCam API error: ${res.status}`)
  const recentPhotos: CCPhoto[] = await res.json()

  // Deduplicate by photo ID
  const seen = new Set<string>()
  const photos: CCPhoto[] = []
  for (const p of [...taggedPhotos, ...recentPhotos]) {
    if (!seen.has(p.id)) {
      seen.add(p.id)
      photos.push(p)
    }
  }

  const projectIds = new Set<string>()
  const projectMap = new Map<string, string>()
  for (const p of photos) {
    if (p.project_id) projectIds.add(p.project_id)
  }

  const ids = Array.from(projectIds)
  const batchSize = 10
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(async (id) => {
        const r = await fetch(`${BASE_URL}/projects/${id}`, {
          headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
        })
        if (r.ok) {
          const proj = await r.json()
          return { id, name: proj.name as string }
        }
        return { id, name: 'Unknown Project' }
      })
    )
    for (const r of results) {
      if (r.status === 'fulfilled') projectMap.set(r.value.id, r.value.name)
    }
  }

  return { photos, projectMap }
}

async function scorePhoto(photoUrl: string): Promise<{
  score: number; contentType: string; serviceType: string; description: string
}> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 200,
    messages: [
      {
        role: 'system',
        content: `You score field service / landscaping / outdoor work photos for SOCIAL MEDIA posting.
Return ONLY valid JSON with these fields:
- score: number 1-10
- contentType: one of: completed_work, before_after, in_progress, crew_shot, equipment, property, close_up, other
- serviceType: one of: landscaping, pressure_washing, lawn_care, christmas_lights, debris_cleanup, hardscaping, irrigation, tree_work, painting, general, other
- description: 1 sentence describing the photo

SCORING GUIDE — BE EXTREMELY HARSH. Most job site photos are NOT social media worthy:
- 9-10: ONLY for jaw-dropping transformations. Crisp before/after, fresh mulch with clean edges, dramatic pressure wash reveal, lush green lawn with perfect stripes. Would make someone stop scrolling and say "I need to hire these guys."
- 7-8: Clearly shows completed professional work. You can SEE what was done. Fresh plantings, clean beds, defined borders, power-washed concrete.
- 5-6: Shows some work but mediocre photo quality or the result isn't impressive.
- 3-4: Just a property photo. No clear work visible. Documentation shot, not marketing material.
- 1-2: Completely unusable. Random yard, dormant lawn, empty lot, tree silhouette, blurry, dark.

SCORE 4 OR BELOW if ANY of these are true:
- No visible landscaping/service work was clearly performed
- Dormant/brown/dead grass with no fresh work on top of it
- Just showing a property "as-is" with no transformation
- Shadows, sunsets, or scenic views that don't showcase WORK
- The photo answers "here's the yard" instead of "look what we did"

The question to ask: "Would a potential customer see this and want to hire us?" If no → score 4 or below.`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Score this photo:' },
          { type: 'image_url', image_url: { url: photoUrl, detail: 'low' } },
        ],
      },
    ],
  })

  const text = response.choices[0]?.message?.content || '{}'
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { score: 5, contentType: 'other', serviceType: 'general', description: 'Could not analyze photo' }
  }
}

export async function scorePhotos(): Promise<ScoredPhoto[]> {
  const { photos, projectMap } = await fetchRecentPhotos()
  const scored: ScoredPhoto[] = []
  const batchSize = 5

  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(async (photo) => {
        const originalUri = photo.uris?.find(u => u.type === 'original')
        const webUri = photo.uris?.find(u => u.type === 'web')
        const thumbUri = photo.uris?.find(u => u.type === 'thumbnail')
        const url = originalUri?.url || webUri?.url || photo.uris?.[0]?.url || ''
        if (!url) return null
        const thumbnail = webUri?.url || thumbUri?.url || url
        const projectName = projectMap.get(photo.project_id || '') || 'Unknown Project'

        const scoreUrl = webUri?.url || thumbnail  // use smaller image for scoring
        const result = await scorePhoto(scoreUrl)
        return {
          photoId: photo.id,
          url,
          thumbnail,
          score: result.score,
          contentType: result.contentType,
          serviceType: result.serviceType,
          description: result.description,
          projectName,
        } as ScoredPhoto
      })
    )
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) scored.push(r.value)
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return scored
}
