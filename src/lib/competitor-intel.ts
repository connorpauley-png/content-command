/**
 * Competitor Intelligence Module
 * 
 * Scrapes and analyzes top performers in each industry.
 * Extracts patterns, templates, and benchmarks.
 */

export interface TopPerformer {
  id: string
  platform: 'instagram' | 'tiktok' | 'facebook' | 'x' | 'linkedin' | 'youtube'
  handle: string
  name: string
  industry: string
  followers: number
  engagementRate: number // percentage
  postsPerWeek: number
  avgLikes: number
  avgComments: number
  topContentTypes: ContentType[]
  lastScraped: Date
}

export interface ContentType {
  type: 'video' | 'reel' | 'carousel' | 'single_image' | 'text_only' | 'before_after'
  percentage: number // what % of their content is this type
  avgEngagement: number
}

export interface ContentPattern {
  id: string
  name: string
  description: string
  industry: string
  platform: string
  format: 'video' | 'reel' | 'carousel' | 'single_image' | 'text_only'
  captionPattern: {
    avgLength: number
    hasHook: boolean
    hasCTA: boolean
    emojiUsage: 'none' | 'minimal' | 'heavy'
    hashtagCount: number
  }
  performanceScore: number // 1-100
  examples: string[] // URLs to example posts
  extractedTemplate: string
}

export interface Benchmark {
  metric: string
  userValue: number
  industryAvg: number
  topPerformerAvg: number
  gap: number
  recommendation: string
}

// Top performers database - seeded manually, updated by scraper
export const TOP_PERFORMERS_SEED: Partial<TopPerformer>[] = [
  // Lawn Care / Landscaping
  {
    platform: 'instagram',
    handle: 'keithjkalfas',
    name: 'Keith Kalfas',
    industry: 'lawn_care',
  },
  {
    platform: 'youtube',
    handle: 'LawnCareMillionaire',
    name: 'Lawn Care Millionaire',
    industry: 'lawn_care',
  },
  {
    platform: 'instagram',
    handle: 'lawntrepreneur',
    name: 'Lawntrepreneur',
    industry: 'lawn_care',
  },
  {
    platform: 'tiktok',
    handle: 'thelawncarejunkie',
    name: 'Lawn Care Junkie',
    industry: 'lawn_care',
  },
  // Pressure Washing
  {
    platform: 'instagram',
    handle: 'pressurewashingresource',
    name: 'Pressure Washing Resource',
    industry: 'pressure_washing',
  },
  {
    platform: 'tiktok',
    handle: 'thepressurewashingguy',
    name: 'The Pressure Washing Guy',
    industry: 'pressure_washing',
  },
  // General Service Business
  {
    platform: 'x',
    handle: 'swaborgrern',
    name: 'Nick Huber',
    industry: 'general',
  },
  {
    platform: 'instagram',
    handle: 'hormozi',
    name: 'Alex Hormozi',
    industry: 'general',
  },
]

// Content patterns we've identified from top performers
export const PROVEN_PATTERNS: ContentPattern[] = [
  {
    id: 'transformation-reveal',
    name: 'Transformation Reveal',
    description: 'Before/after with satisfying reveal moment',
    industry: 'lawn_care',
    platform: 'instagram',
    format: 'reel',
    captionPattern: {
      avgLength: 50,
      hasHook: false,
      hasCTA: false,
      emojiUsage: 'none',
      hashtagCount: 5,
    },
    performanceScore: 95,
    examples: [],
    extractedTemplate: 'Before and after. No commentary needed.',
  },
  {
    id: 'satisfying-clean',
    name: 'Satisfying Clean',
    description: 'Close-up of satisfying work (edging, pressure washing lines)',
    industry: 'lawn_care',
    platform: 'tiktok',
    format: 'video',
    captionPattern: {
      avgLength: 20,
      hasHook: false,
      hasCTA: false,
      emojiUsage: 'none',
      hashtagCount: 3,
    },
    performanceScore: 90,
    examples: [],
    extractedTemplate: '', // Often no caption at all
  },
  {
    id: 'day-in-life',
    name: 'Day in the Life',
    description: 'Raw footage of actual work day',
    industry: 'lawn_care',
    platform: 'instagram',
    format: 'reel',
    captionPattern: {
      avgLength: 100,
      hasHook: true,
      hasCTA: false,
      emojiUsage: 'none',
      hashtagCount: 5,
    },
    performanceScore: 85,
    examples: [],
    extractedTemplate: '5 AM start. Here is what today looked like.',
  },
  {
    id: 'crew-appreciation',
    name: 'Crew Appreciation',
    description: 'Spotlighting the team',
    industry: 'lawn_care',
    platform: 'instagram',
    format: 'carousel',
    captionPattern: {
      avgLength: 150,
      hasHook: false,
      hasCTA: false,
      emojiUsage: 'none',
      hashtagCount: 5,
    },
    performanceScore: 80,
    examples: [],
    extractedTemplate: 'The crew that makes it happen.',
  },
  {
    id: 'income-transparency',
    name: 'Income Transparency',
    description: 'Sharing real numbers (revenue, jobs, growth)',
    industry: 'general',
    platform: 'x',
    format: 'text_only',
    captionPattern: {
      avgLength: 280,
      hasHook: true,
      hasCTA: false,
      emojiUsage: 'none',
      hashtagCount: 0,
    },
    performanceScore: 92,
    examples: [],
    extractedTemplate: 'Month {X} running {business}: {revenue} revenue, {employees} employees, {lessons learned}.',
  },
  {
    id: 'contrarian-take',
    name: 'Contrarian Take',
    description: 'Opinion that challenges conventional wisdom',
    industry: 'general',
    platform: 'x',
    format: 'text_only',
    captionPattern: {
      avgLength: 200,
      hasHook: true,
      hasCTA: false,
      emojiUsage: 'none',
      hashtagCount: 0,
    },
    performanceScore: 88,
    examples: [],
    extractedTemplate: 'Unpopular opinion: {contrarian statement}. Here is why.',
  },
]

/**
 * Get patterns for a specific industry
 */
export function getPatternsForIndustry(industry: string): ContentPattern[] {
  return PROVEN_PATTERNS.filter(p => 
    p.industry === industry || p.industry === 'general'
  ).sort((a, b) => b.performanceScore - a.performanceScore)
}

/**
 * Get patterns for a specific platform
 */
export function getPatternsForPlatform(platform: string): ContentPattern[] {
  return PROVEN_PATTERNS.filter(p => p.platform === platform)
    .sort((a, b) => b.performanceScore - a.performanceScore)
}

/**
 * Generate benchmarks comparing user to top performers
 */
export function generateBenchmarks(
  userMetrics: {
    postsPerWeek: number
    engagementRate: number
    avgLikes: number
    transformationPostsPerMonth: number
    videoPercentage: number
  },
  industry: string
): Benchmark[] {
  // Industry benchmarks (would be calculated from scraped data)
  const industryBenchmarks = {
    lawn_care: {
      postsPerWeek: { avg: 5, top: 14 },
      engagementRate: { avg: 2.5, top: 5.5 },
      transformationPostsPerMonth: { avg: 4, top: 12 },
      videoPercentage: { avg: 40, top: 80 },
    },
    pressure_washing: {
      postsPerWeek: { avg: 4, top: 10 },
      engagementRate: { avg: 3.0, top: 7.0 },
      transformationPostsPerMonth: { avg: 6, top: 15 },
      videoPercentage: { avg: 60, top: 90 },
    },
    general: {
      postsPerWeek: { avg: 7, top: 21 },
      engagementRate: { avg: 2.0, top: 4.0 },
      transformationPostsPerMonth: { avg: 2, top: 8 },
      videoPercentage: { avg: 50, top: 75 },
    },
  }

  const benchmarks = industryBenchmarks[industry as keyof typeof industryBenchmarks] || industryBenchmarks.general

  return [
    {
      metric: 'Posts per week',
      userValue: userMetrics.postsPerWeek,
      industryAvg: benchmarks.postsPerWeek.avg,
      topPerformerAvg: benchmarks.postsPerWeek.top,
      gap: benchmarks.postsPerWeek.top - userMetrics.postsPerWeek,
      recommendation: userMetrics.postsPerWeek < benchmarks.postsPerWeek.avg
        ? `Increase posting frequency. You're at ${userMetrics.postsPerWeek}/week, top performers post ${benchmarks.postsPerWeek.top}/week.`
        : 'Posting frequency is solid. Focus on content quality.',
    },
    {
      metric: 'Engagement rate',
      userValue: userMetrics.engagementRate,
      industryAvg: benchmarks.engagementRate.avg,
      topPerformerAvg: benchmarks.engagementRate.top,
      gap: benchmarks.engagementRate.top - userMetrics.engagementRate,
      recommendation: userMetrics.engagementRate < benchmarks.engagementRate.avg
        ? 'Engagement is below average. Try more transformation content and video.'
        : 'Engagement is strong. Keep doing what works.',
    },
    {
      metric: 'Transformation posts/month',
      userValue: userMetrics.transformationPostsPerMonth,
      industryAvg: benchmarks.transformationPostsPerMonth.avg,
      topPerformerAvg: benchmarks.transformationPostsPerMonth.top,
      gap: benchmarks.transformationPostsPerMonth.top - userMetrics.transformationPostsPerMonth,
      recommendation: userMetrics.transformationPostsPerMonth < benchmarks.transformationPostsPerMonth.avg
        ? 'Before/after content is your highest performer. Post more transformations.'
        : 'Good transformation content volume.',
    },
    {
      metric: 'Video content %',
      userValue: userMetrics.videoPercentage,
      industryAvg: benchmarks.videoPercentage.avg,
      topPerformerAvg: benchmarks.videoPercentage.top,
      gap: benchmarks.videoPercentage.top - userMetrics.videoPercentage,
      recommendation: userMetrics.videoPercentage < benchmarks.videoPercentage.avg
        ? 'Video gets 3x the reach of photos. Shift to more Reels/TikTok.'
        : 'Good video mix.',
    },
  ]
}
