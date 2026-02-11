'use server'

import { supabaseAdmin } from '@/lib/supabase'
import { startGeneration as astriaStart, checkPrompt } from '@/lib/astria'
import { fetchRecentPhotos, getPhotoUrl, analyzePhoto } from '@/lib/photo-scanner'
import { revalidatePath } from 'next/cache'

type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

// ── Add CompanyCam photos to a post ─────────────────────────

export async function addCompanyCamPhotos(
  postId: string,
  photoUrls: string[]
): Promise<ActionResult> {
  try {
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('cc_posts')
      .select('photo_urls, version')
      .eq('id', postId)
      .single()

    if (fetchError || !post) return { success: false, error: 'Post not found' }

    const existingUrls = post.photo_urls || []
    const mergedUrls = [...existingUrls, ...photoUrls.filter(u => !existingUrls.includes(u))]

    const { data, error } = await supabaseAdmin
      .from('cc_posts')
      .update({
        photo_urls: mergedUrls,
        photo_source: 'companycam',
        status: 'photo_review',
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/pipeline')
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to add photos' }
  }
}

// ── Start AI photo generation (Astria) ──────────────────────

export async function startAIGeneration(
  postId: string,
  prompt: string
): Promise<ActionResult<{ generationId: string }>> {
  try {
    // Update post status to generating
    await supabaseAdmin
      .from('cc_posts')
      .update({
        status: 'generating',
        ai_generated: true,
        photo_source: 'generated',
        notes: `[AI] Prompt: ${prompt}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    // Start Astria generation
    const { promptId } = await astriaStart({ prompt })

    // Store generation ID on the post
    try {
      await supabaseAdmin
        .from('cc_posts')
        .update({
          generation_id: String(promptId),
          generation_prompt: prompt,
        })
        .eq('id', postId)
    } catch {
      // generation_id/generation_prompt columns may not exist in v1 schema
      await supabaseAdmin
        .from('cc_posts')
        .update({
          notes: `[AI] Prompt: ${prompt}\n[GENERATION_ID] ${promptId}`,
        })
        .eq('id', postId)
    }

    revalidatePath('/pipeline')
    return { success: true, data: { generationId: String(promptId) } }
  } catch (e) {
    // Revert status on failure
    await supabaseAdmin
      .from('cc_posts')
      .update({ status: 'idea_approved', updated_at: new Date().toISOString() })
      .eq('id', postId)

    return { success: false, error: e instanceof Error ? e.message : 'Failed to start generation' }
  }
}

// ── Check AI generation status and attach results ───────────

export async function checkAIGeneration(
  postId: string,
  promptId: string
): Promise<ActionResult<{ status: string; images?: string[] }>> {
  try {
    const result = await checkPrompt(Number(promptId))

    if (result.status === 'completed' && result.images) {
      // Attach generated images to the post
      await supabaseAdmin
        .from('cc_posts')
        .update({
          photo_urls: result.images,
          status: 'photo_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)

      revalidatePath('/pipeline')
      return { success: true, data: { status: 'completed', images: result.images } }
    }

    if (result.status === 'failed') {
      await supabaseAdmin
        .from('cc_posts')
        .update({
          status: 'idea_approved',
          notes: `[AI FAILED] ${result.error}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)

      return { success: false, error: result.error || 'Generation failed' }
    }

    return { success: true, data: { status: 'processing' } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to check generation' }
  }
}

// ── Remove a photo from a post ──────────────────────────────

export async function removePhoto(
  postId: string,
  photoUrl: string
): Promise<ActionResult> {
  try {
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('cc_posts')
      .select('photo_urls')
      .eq('id', postId)
      .single()

    if (fetchError || !post) return { success: false, error: 'Post not found' }

    const updatedUrls = (post.photo_urls || []).filter((u: string) => u !== photoUrl)

    const { data, error } = await supabaseAdmin
      .from('cc_posts')
      .update({
        photo_urls: updatedUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single()

    if (error) return { success: false, error: error.message }

    revalidatePath('/pipeline')
    return { success: true, data }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Failed to remove photo' }
  }
}

// ── Upload a photo to Supabase storage ──────────────────────

export async function uploadPhoto(formData: FormData): Promise<ActionResult<{ url: string }>> {
  try {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: 'No file provided' }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('content-photos')
      .upload(filename, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      // Fallback: try enhanced-photos bucket
      const { error: fallbackError } = await supabaseAdmin.storage
        .from('enhanced-photos')
        .upload(filename, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: true,
        })

      if (fallbackError) {
        return { success: false, error: fallbackError.message }
      }

      const { data: urlData } = supabaseAdmin.storage
        .from('enhanced-photos')
        .getPublicUrl(filename)

      return { success: true, data: { url: urlData.publicUrl } }
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('content-photos')
      .getPublicUrl(filename)

    return { success: true, data: { url: urlData.publicUrl } }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Upload failed' }
  }
}

// ── Scan CompanyCam for usable photos ───────────────────────

export async function scanCompanyCam(
  limit = 10
): Promise<ActionResult<ScannedPhoto[]>> {
  try {
    const photos = await fetchRecentPhotos(30)
    const results: ScannedPhoto[] = []

    for (const photo of photos) {
      if (results.length >= limit) break

      const webUrl = getPhotoUrl(photo, 'web')
      const thumbUrl = getPhotoUrl(photo, 'thumbnail')

      // Check if already used
      const { data: usedPosts } = await supabaseAdmin
        .from('cc_posts')
        .select('id')
        .contains('photo_urls', [webUrl])
        .limit(1)

      if (usedPosts && usedPosts.length > 0) continue

      const projectName = photo.project?.name || 'Job Site'
      const addr = photo.project?.address
      const projectAddress = addr
        ? `${addr.street_address_1 || ''}, ${addr.city || ''} ${addr.state || ''}`.trim()
        : 'Monroe, LA'

      // Analyze with vision AI
      const analysis = await analyzePhoto(webUrl, projectName, projectAddress)

      if (analysis.quality >= 6) {
        results.push({
          photoId: photo.id,
          photoUrl: webUrl,
          thumbnailUrl: thumbUrl,
          projectName,
          projectAddress,
          capturedAt: photo.captured_at
            ? new Date(photo.captured_at * 1000).toISOString()
            : new Date().toISOString(),
          analysis,
        })
      }
    }

    return { success: true, data: results }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Scan failed' }
  }
}

// ── Types ───────────────────────────────────────────────────

export type ScannedPhoto = {
  photoId: string
  photoUrl: string
  thumbnailUrl: string
  projectName: string
  projectAddress: string
  capturedAt: string
  analysis: {
    scene: string
    quality: number
    postType: string
    platforms: string[]
    caption: string
    hashtags: string[]
  }
}
