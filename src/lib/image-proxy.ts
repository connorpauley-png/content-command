// Downloads an image from any URL and re-uploads to Supabase storage for a permanent public URL
// This is needed because Instagram/Facebook require publicly accessible image URLs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET = 'enhanced-photos'

export async function ensurePublicUrl(imageUrl: string): Promise<string> {
  // If it's already a Supabase URL or CompanyCam URL (public), return as-is
  if (imageUrl.includes('supabase.co') || imageUrl.includes('companycam.com')) {
    return imageUrl
  }

  try {
    // Download the image
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`Failed to download image: ${res.status}`)
    
    const buffer = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const filename = `ccc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    // Upload to Supabase storage
    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: buffer,
      }
    )

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      throw new Error(`Supabase upload failed: ${err}`)
    }

    // Return public URL
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`
  } catch (error) {
    console.error('Image proxy failed:', error)
    // Return original URL as fallback
    return imageUrl
  }
}
