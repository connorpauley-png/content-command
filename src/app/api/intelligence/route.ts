import { NextRequest, NextResponse } from 'next/server'
import { getCurrentOrg } from '@/lib/tenant'
import { 
  getPatternsForIndustry, 
  generateBenchmarks,
  PROVEN_PATTERNS,
  TOP_PERFORMERS_SEED 
} from '@/lib/competitor-intel'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const action = searchParams.get('action') || 'overview'
  
  const org = getCurrentOrg()

  switch (action) {
    case 'overview': {
      // Return high-level intelligence
      const patterns = getPatternsForIndustry(org.industry)
      
      return NextResponse.json({
        industry: org.industry,
        topPerformers: TOP_PERFORMERS_SEED.filter(p => 
          !p.industry || p.industry === org.industry || p.industry === 'general'
        ),
        topPatterns: patterns.slice(0, 5),
        recommendations: [
          {
            priority: 'high',
            title: 'Post more before/after content',
            description: 'Transformation content gets 3x engagement vs regular posts',
            action: 'generate_transformation',
          },
          {
            priority: 'high',
            title: 'Increase video content',
            description: 'Top performers post 70%+ video. You should shift from photos to Reels.',
            action: 'video_guide',
          },
          {
            priority: 'medium',
            title: 'Post consistently',
            description: 'Top performers in lawn care post 14x/week. Consistency beats quality.',
            action: 'increase_frequency',
          },
          {
            priority: 'medium',
            title: 'Remove emojis from captions',
            description: 'Data shows professional service businesses get better engagement without emojis.',
            action: 'update_captions',
          },
        ],
      })
    }
    
    case 'benchmarks': {
      // Compare user metrics to industry benchmarks
      // In production, would pull actual user metrics from analytics
      const userMetrics = {
        postsPerWeek: 3,  // Would be calculated
        engagementRate: 2.1,
        avgLikes: 45,
        transformationPostsPerMonth: 2,
        videoPercentage: 20,
      }
      
      const benchmarks = generateBenchmarks(userMetrics, org.industry)
      
      return NextResponse.json({
        industry: org.industry,
        userMetrics,
        benchmarks,
        overallScore: calculateOverallScore(benchmarks),
      })
    }
    
    case 'patterns': {
      // Return all proven content patterns for this industry
      const platform = searchParams.get('platform')
      let patterns = getPatternsForIndustry(org.industry)
      
      if (platform) {
        patterns = patterns.filter(p => p.platform === platform)
      }
      
      return NextResponse.json({
        industry: org.industry,
        patterns,
      })
    }
    
    case 'trending': {
      // Return what's trending right now
      // In production, would scrape recent viral content
      return NextResponse.json({
        trending: [
          {
            format: 'satisfying_reel',
            description: 'Oddly satisfying lawn/cleaning videos',
            engagement_boost: '+250%',
            example_hooks: [
              'Watch till the end',
              'This took 6 hours',
              'POV: You hired professionals',
            ],
          },
          {
            format: 'day_in_life',
            description: 'Raw day-in-the-life content',
            engagement_boost: '+150%',
            example_hooks: [
              '5 AM start',
              'What $X gets you',
              'Nobody talks about this part',
            ],
          },
          {
            format: 'transformation_carousel',
            description: 'Swipe-through before/after',
            engagement_boost: '+180%',
            example_hooks: [
              'Swipe to see the difference',
              'Same property',
              '→',
            ],
          },
        ],
        platforms: {
          instagram: {
            best_times: ['6-8am', '12-1pm', '7-9pm'],
            best_days: ['Tuesday', 'Wednesday', 'Saturday'],
            optimal_hashtags: 5,
            reels_boost: true,
          },
          tiktok: {
            best_times: ['7-9am', '12-3pm', '7-11pm'],
            best_days: ['Tuesday', 'Thursday', 'Friday'],
            trending_sounds: true,
            optimal_length: '15-30s',
          },
          facebook: {
            best_times: ['1-4pm'],
            best_days: ['Wednesday', 'Friday'],
            video_autoplay: true,
            groups_boost: true,
          },
        },
      })
    }
    
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}

function calculateOverallScore(benchmarks: any[]): number {
  // Calculate overall performance score 0-100
  let score = 50 // Start at average
  
  for (const b of benchmarks) {
    if (b.userValue >= b.topPerformerAvg) {
      score += 12.5 // Top performer level
    } else if (b.userValue >= b.industryAvg) {
      score += 6.25 // Above average
    } else {
      score -= 6.25 // Below average
    }
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}
