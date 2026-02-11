/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, AI_PHOTO_PLATFORMS, COMPANYCAM_PLATFORMS } from '@/lib/supabase'
import { startGeneration, checkPrompt } from '@/lib/astria'

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_TOKEN!

// Approve an idea - moves to photo stage
async function approveIdea(postId: string) {
  const { data: post, error: fetchError } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    throw new Error('Post not found')
  }

  const platforms = post.platforms || []
  const needsAI = platforms.some((p: string) => AI_PHOTO_PLATFORMS.includes(p as any))
  const needsCompanyCam = platforms.some((p: string) => COMPANYCAM_PLATFORMS.includes(p as any))

  const { error } = await supabaseAdmin
    .from('cc_posts')
    .update({
      status: 'idea_approved',
      photo_source: needsAI ? 'generated' : needsCompanyCam ? 'companycam' : 'manual',
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) throw error
  return { status: 'idea_approved', photoSource: needsAI ? 'generated' : 'companycam' }
}

// Start AI photo generation in background (non-blocking)
async function startPhotoGeneration(postId: string, prompt: string) {
  const { data: post, error: fetchError } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    throw new Error('Post not found')
  }

  // Start generation (returns immediately)
  const { promptId, status } = await startGeneration({
    prompt,
    numImages: 2,
  })

  // Store prompt ID in notes field
  const { error } = await supabaseAdmin
    .from('cc_posts')
    .update({
      status: 'generating',
      notes: JSON.stringify({ promptId, prompt, startedAt: Date.now() }),
      ai_generated: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) throw error
  return { status: 'generating', promptId }
}

// Check if generation is complete and update post
async function checkGeneration(postId: string) {
  const { data: post, error: fetchError } = await supabaseAdmin
    .from('cc_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    throw new Error('Post not found')
  }

  if (post.status !== 'generating') {
    return { status: post.status, complete: true }
  }

  // Parse prompt info from notes
  let promptInfo
  try {
    promptInfo = JSON.parse(post.notes || '{}')
  } catch {
    throw new Error('Invalid prompt info')
  }

  if (!promptInfo.promptId) {
    throw new Error('No prompt ID found')
  }

  // Check prompt status via Astria
  const result = await checkPrompt(promptInfo.promptId)

  if (result.status === 'completed' && result.images) {
    // Update post with generated photos
    const { error } = await supabaseAdmin
      .from('cc_posts')
      .update({
        status: 'photo_review',
        photo_urls: result.images,
        notes: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    if (error) throw error
    return { status: 'photo_review', complete: true, photos: result.images }
  } else if (result.status === 'failed') {
    // Mark as failed, return to idea_approved
    const { error } = await supabaseAdmin
      .from('cc_posts')
      .update({
        status: 'idea_approved',
        notes: `Generation failed: ${result.error}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    if (error) throw error
    return { status: 'failed', complete: true, error: result.error }
  }

  // Still processing
  return { status: 'generating', complete: false }
}

// Add CompanyCam photos to a post
async function addCompanyCamPhotos(postId: string, photoUrls: string[]) {
  const { error } = await supabaseAdmin
    .from('cc_posts')
    .update({
      status: 'photo_review',
      photo_urls: photoUrls,
      ai_generated: false,
      photo_source: 'companycam',
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) throw error
  return { status: 'photo_review', photos: photoUrls }
}

// Final approval - ready to post
async function approvePhotos(postId: string) {
  const { error } = await supabaseAdmin
    .from('cc_posts')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) throw error
  return { status: 'approved' }
}

// Approve text-only post - skip photos, go directly to approved
async function approveTextOnly(postId: string) {
  const { data: post, error: fetchError } = await supabaseAdmin
    .from('cc_posts')
    .select('platforms')
    .eq('id', postId)
    .single()

  if (fetchError || !post) {
    throw new Error('Post not found')
  }

  // Check if any platform requires photos (Instagram)
  const platforms = post.platforms || []
  const requiresPhotos = platforms.some((p: string) => p === 'instagram' || p === 'ig_personal')
  
  if (requiresPhotos) {
    // Remove Instagram from platforms since we're going text-only
    const textPlatforms = platforms.filter((p: string) => p !== 'instagram' && p !== 'ig_personal')
    
    if (textPlatforms.length === 0) {
      throw new Error('Instagram requires photos. Add photos or remove Instagram from this post.')
    }

    const { error } = await supabaseAdmin
      .from('cc_posts')
      .update({
        status: 'approved',
        platforms: textPlatforms,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    if (error) throw error
    return { status: 'approved', note: 'Instagram removed (requires photos)' }
  }

  const { error } = await supabaseAdmin
    .from('cc_posts')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) throw error
  return { status: 'approved' }
}

// Reject and send back to ideas
async function rejectToIdea(postId: string, notes?: string) {
  const { error } = await supabaseAdmin
    .from('cc_posts')
    .update({
      status: 'idea',
      photo_urls: [],
      ai_generated: false,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) throw error
  return { status: 'idea' }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, postId, ...options } = body

    if (!postId) {
      return NextResponse.json({ error: 'postId required' }, { status: 400 })
    }

    let result
    switch (action) {
      case 'approve_idea':
        result = await approveIdea(postId)
        break
      case 'approve_text_only':
        result = await approveTextOnly(postId)
        break
      case 'add_photos':
        if (options.prompt) {
          // Start AI generation (non-blocking)
          result = await startPhotoGeneration(postId, options.prompt)
        } else if (options.companycamPhotos) {
          result = await addCompanyCamPhotos(postId, options.companycamPhotos)
        } else {
          return NextResponse.json({ error: 'prompt or companycamPhotos required' }, { status: 400 })
        }
        break
      case 'check_generation':
        result = await checkGeneration(postId)
        break
      case 'approve_photos':
        result = await approvePhotos(postId)
        break
      case 'reject':
        result = await rejectToIdea(postId, options.notes)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Workflow error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Workflow failed' },
      { status: 500 }
    )
  }
}

// GET - list posts by stage
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')

  let query = supabaseAdmin.from('cc_posts').select('*').order('created_at', { ascending: false })

  if (stage === 'ideas') {
    query = query.eq('status', 'idea')
  } else if (stage === 'photos') {
    query = query.in('status', ['idea_approved', 'photo_review', 'generating'])
  } else if (stage === 'ready') {
    query = query.eq('status', 'approved')
  }

  const { data, error } = await query.limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data })
}
