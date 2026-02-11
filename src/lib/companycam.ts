const CC_TOKEN = process.env.COMPANYCAM_TOKEN || ''
const CC_BASE = 'https://api.companycam.com/v2'

const headers = { Authorization: `Bearer ${CC_TOKEN}` }

export type CCProject = {
  id: string
  name: string
  address: { street_address_1?: string; city?: string; state?: string }
  photo_count: number
  updated_at: number
}

export type CCPhoto = {
  id: string
  project_id: string
  creator_name: string
  created_at: number
  uris: { type: string; uri: string }[]
  tags: { display_value: string }[]
}

export async function getProjects(page = 1, perPage = 20): Promise<CCProject[]> {
  const res = await fetch(`${CC_BASE}/projects?page=${page}&per_page=${perPage}&sort=updated_at&order=desc`, { headers })
  if (!res.ok) throw new Error(`CompanyCam projects: ${res.status}`)
  return res.json()
}

export async function getProjectPhotos(projectId: string, page = 1, perPage = 20): Promise<CCPhoto[]> {
  const res = await fetch(`${CC_BASE}/projects/${projectId}/photos?page=${page}&per_page=${perPage}`, { headers })
  if (!res.ok) throw new Error(`CompanyCam photos: ${res.status}`)
  return res.json()
}

export async function getRecentPhotos(perPage = 20): Promise<CCPhoto[]> {
  const res = await fetch(`${CC_BASE}/photos?per_page=${perPage}&sort=created_at&order=desc`, { headers })
  if (!res.ok) throw new Error(`CompanyCam recent: ${res.status}`)
  return res.json()
}

export function getPhotoUrl(photo: CCPhoto, size: 'original' | 'web' | 'thumbnail' = 'web'): string {
  const uri = photo.uris.find(u => u.type === size) || photo.uris[0]
  return uri?.uri || ''
}
