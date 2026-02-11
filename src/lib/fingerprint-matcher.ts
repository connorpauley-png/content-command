/**
 * Fingerprint-based Before/After Matcher
 * 
 * Logic:
 * - messy (0-10) = BEFORE potential
 * - clean (0-10) = AFTER potential  
 * - Same fingerprint + opposite scores = valid pair
 */

export interface PhotoAnalysis {
  id: string;
  url: string;
  fingerprint: string;
  messy: number;  // 0-10
  clean: number;  // 0-10
  projectId?: string;
  capturedAt?: number;
}

export interface MatchedPair {
  before: PhotoAnalysis;
  after: PhotoAnalysis;
  fingerprint: string;
  score: number;  // quality of the match
}

/**
 * Vision prompt for analyzing photos
 */
export const ANALYSIS_PROMPT = `Analyze this landscaping/outdoor service photo.

Return JSON only:
{
  "fingerprint": "brief description of the view - what angle, key landmarks (house color, fence type, trees, etc)",
  "messy": <0-10 how messy/overgrown/dirty>,
  "clean": <0-10 how clean/maintained/finished>
}

messy = needs work (debris, overgrown, dirty, damaged)
clean = work done (fresh mulch, trimmed, cleaned, repaired)

A photo can't be both high messy AND high clean.`;

/**
 * Normalize fingerprint for matching
 */
export function normalizeFingerprint(fp: string): string {
  return fp
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .sort()
    .join(' ')
    .trim();
}

/**
 * Calculate similarity between two fingerprints
 * Returns 0-1 score
 */
export function fingerprintSimilarity(fp1: string, fp2: string): number {
  const words1 = new Set(normalizeFingerprint(fp1).split(' '));
  const words2 = new Set(normalizeFingerprint(fp2).split(' '));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;  // Jaccard similarity
}

/**
 * Match photos into before/after pairs
 */
export function matchPhotos(photos: PhotoAnalysis[]): MatchedPair[] {
  const pairs: MatchedPair[] = [];
  const used = new Set<string>();
  
  // Sort by messy score descending (best befores first)
  const sortedByMessy = [...photos].sort((a, b) => b.messy - a.messy);
  
  for (const beforeCandidate of sortedByMessy) {
    if (used.has(beforeCandidate.id)) continue;
    if (beforeCandidate.messy < 5) continue;  // Must be at least somewhat messy
    
    // Find best matching clean photo
    let bestAfter: PhotoAnalysis | null = null;
    let bestSimilarity = 0;
    
    for (const afterCandidate of photos) {
      if (afterCandidate.id === beforeCandidate.id) continue;
      if (used.has(afterCandidate.id)) continue;
      if (afterCandidate.clean < 5) continue;  // Must be at least somewhat clean
      
      const similarity = fingerprintSimilarity(
        beforeCandidate.fingerprint,
        afterCandidate.fingerprint
      );
      
      if (similarity > 0.3 && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestAfter = afterCandidate;
      }
    }
    
    if (bestAfter) {
      // Calculate match quality score
      const score = (
        beforeCandidate.messy + 
        bestAfter.clean + 
        bestSimilarity * 10
      ) / 3;
      
      pairs.push({
        before: beforeCandidate,
        after: bestAfter,
        fingerprint: beforeCandidate.fingerprint,
        score
      });
      
      used.add(beforeCandidate.id);
      used.add(bestAfter.id);
    }
  }
  
  // Sort by quality score
  return pairs.sort((a, b) => b.score - a.score);
}

/**
 * Generate caption for a matched pair
 */
export function generateCaption(pair: MatchedPair): string {
  const captions = [
    "Same property. Different day.",
    "The transformation speaks for itself.",
    "Before and after. That's the difference.",
    "From overgrown to outstanding.",
    "Clean lines, fresh start.",
    "What a difference proper care makes.",
  ];
  
  return captions[Math.floor(Math.random() * captions.length)];
}
