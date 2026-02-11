/* eslint-disable @typescript-eslint/no-explicit-any */
// Duplicate detection for posts
// Prevents posting the same or very similar content twice

import { createHash } from 'crypto'
import { supabaseAdmin } from './supabase'

// Create a normalized hash of content for exact match detection
export function hashContent(content: string): string {
  // Normalize: lowercase, remove extra whitespace, remove punctuation
  const normalized = content
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16)
}

// Simple similarity score (Jaccard index on words)
export function similarityScore(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])
  
  return intersection.size / union.size
}

// Check if content is a duplicate of any posted content
export async function checkDuplicate(
  content: string,
  platforms: string[],
  excludePostId?: string
): Promise<{
  isDuplicate: boolean
  matchType?: 'exact' | 'similar'
  matchedPostId?: string
  matchedContent?: string
  similarity?: number
}> {
  const hash = hashContent(content)
  
  // Get all posted content for these platforms
  const { data: posts } = await supabaseAdmin
    .from('cc_posts')
    .select('id, content, content_hash, platforms')
    .in('status', ['posted', 'approved'])
    .order('created_at', { ascending: false })
    .limit(200)
  
  if (!posts || posts.length === 0) {
    return { isDuplicate: false }
  }
  
  for (const post of posts) {
    // Skip self
    if (excludePostId && post.id === excludePostId) continue
    
    // Check if platforms overlap
    const platformOverlap = platforms.some(p => post.platforms?.includes(p))
    if (!platformOverlap) continue
    
    // Exact hash match
    if (post.content_hash === hash) {
      return {
        isDuplicate: true,
        matchType: 'exact',
        matchedPostId: post.id,
        matchedContent: post.content?.slice(0, 100),
        similarity: 1.0,
      }
    }
    
    // Similarity check (>70% similar = flag it)
    const sim = similarityScore(content, post.content || '')
    if (sim > 0.7) {
      return {
        isDuplicate: true,
        matchType: 'similar',
        matchedPostId: post.id,
        matchedContent: post.content?.slice(0, 100),
        similarity: sim,
      }
    }
  }
  
  return { isDuplicate: false }
}

// Get content hash for storing with new posts
export function getContentHash(content: string): string {
  return hashContent(content)
}
