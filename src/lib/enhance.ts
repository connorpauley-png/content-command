// Auto-enhance photos before publishing
// Downloads → enhances with Pillow → uploads to Supabase Storage → returns public URL

import { createHash } from 'crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET = 'enhanced-photos'
const ENHANCED_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

export async function enhancePhotosForPost(
  photoUrls: string[]
): Promise<string[]> {
  if (!photoUrls || photoUrls.length === 0) return []

  const enhanced: string[] = []

  for (const url of photoUrls) {
    // Already enhanced? Keep it
    if (url.startsWith(ENHANCED_PREFIX)) {
      enhanced.push(url)
      continue
    }

    try {
      // Download the image
      const imgRes = await fetch(url)
      if (!imgRes.ok) {
        console.error(`Failed to download: ${url}`)
        enhanced.push(url) // Use original as fallback
        continue
      }
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

      // Generate filename from URL hash
      const hash = createHash('md5').update(url).digest('hex').slice(0, 12)
      const filename = `${hash}-medium.jpg`

      // Upload original to Supabase (we'll enhance via the upload)
      // For now, do a server-side Pillow enhancement via child_process
      const { execSync } = await import('child_process')
      const fs = await import('fs')
      const os = await import('os')
      const path = await import('path')

      const tmpIn = path.join(os.tmpdir(), `enhance-in-${hash}.jpg`)
      const tmpOut = path.join(os.tmpdir(), `enhance-out-${hash}.jpg`)

      fs.writeFileSync(tmpIn, imgBuffer)

      // Run Pillow enhancement
      try {
        execSync(
          `uv run --with Pillow /Users/clawdbot/.openclaw/workspace/content-command/scripts/enhance-photo.py "${tmpIn}" "${tmpOut}" --level medium`,
          { timeout: 15000, stdio: 'pipe' }
        )
      } catch (enhanceErr) {
        console.error(`Enhancement failed, using original: ${enhanceErr}`)
        // Use original
        fs.copyFileSync(tmpIn, tmpOut)
      }

      // Upload enhanced image to Supabase Storage
      const enhancedBuffer = fs.readFileSync(tmpOut)
      const uploadPath = `${BUCKET}/${filename}`
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${uploadPath}`

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        body: enhancedBuffer,
      })

      // Cleanup temp files
      try {
        fs.unlinkSync(tmpIn)
        fs.unlinkSync(tmpOut)
      } catch {
        // ignore cleanup errors
      }

      if (uploadRes.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${uploadPath}`
        enhanced.push(publicUrl)
      } else {
        console.error(`Upload failed: ${uploadRes.status}`)
        enhanced.push(url) // Fallback to original
      }
    } catch (err) {
      console.error(`Enhancement pipeline error: ${err}`)
      enhanced.push(url) // Fallback to original
    }
  }

  return enhanced
}
