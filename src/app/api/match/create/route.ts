import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const supabase = supabaseAdmin;

interface CreateMatchRequest {
  beforeUrl: string;
  afterUrl: string;
  beforeId: string;
  afterId: string;
  caption: string;
  projectName?: string;
  fingerprint?: string;
}

/**
 * POST /api/match/create
 * 
 * Creates a combined before/after image and queues a post
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateMatchRequest = await request.json();
    const { beforeUrl, afterUrl, beforeId, afterId, caption, projectName, fingerprint } = body;
    
    if (!beforeUrl || !afterUrl || !caption) {
      return NextResponse.json({ error: 'beforeUrl, afterUrl, and caption required' }, { status: 400 });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `match-${beforeId}-${afterId}-${timestamp}.jpg`;
    
    // Call Python script to create combined image (or use server-side image processing)
    // For now, we'll store the individual URLs and combine client-side or via external service
    
    // Create post with both image URLs
    const { data, error } = await supabase
      .from('cc_posts')
      .insert({
        content: caption,
        platforms: ['instagram', 'facebook', 'nextdoor'],
        status: 'idea',
        photo_urls: [beforeUrl, afterUrl],  // Store both, combine on publish
        photo_source: 'companycam',
        ai_generated: false,
        tags: ['before-after', 'ai-fingerprint-matched', 'needs-combine'],
        notes: `AI matched. ${projectName ? `Project: ${projectName}. ` : ''}${fingerprint ? `View: ${fingerprint}` : ''}`
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      postId: data.id,
      message: 'Post created and queued for approval'
    });
    
  } catch (error) {
    console.error('Create match error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
