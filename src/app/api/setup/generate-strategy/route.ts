import { NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import type { AIConfig, BusinessConfig, PlatformAccount, ContentStrategy } from '@/types'
import { platformAdapters } from '@/lib/platforms'

export async function POST(request: Request) {
  try {
    const { aiConfig, business, accounts } = (await request.json()) as {
      aiConfig: AIConfig
      business: BusinessConfig
      accounts: PlatformAccount[]
    }

    const accountSummary = accounts
      .map((a) => {
        const adapter = platformAdapters[a.platform]
        return `- ${adapter.displayName} (@${a.handle}):
    Goal: ${a.goal}
    Personality: ${a.personality || 'business'} (${a.personality === 'personal' ? 'personal stories, life updates, behind the scenes' : a.personality === 'both' ? 'mix of business and personal' : 'promote services, share work'})
    Voice: ${(a.voiceOverride && a.voiceOverride.length > 0) ? a.voiceOverride.join(', ') : 'use business default'}
    Content Description: ${a.contentDescription || 'not specified'}
    Sample Topics: ${(a.sampleTopics && a.sampleTopics.length > 0) ? a.sampleTopics.join(', ') : 'not specified'}
    ${a.postsPerWeek} posts/week, Content types: ${a.contentTypes.join(', ')}`
      })
      .join('\n')

    const prompt = `You are a social media strategist. Create a UNIQUE content strategy for EACH account. Do NOT just reformat the same content for different platforms — each account has its own personality, voice, and purpose. A "personal" account should get personal storytelling content. A "business" account should get service/work content. They should feel like completely different people are posting.

BUSINESS:
- Name: ${business.name}
- Industry: ${business.industry}${business.customIndustry ? ` (${business.customIndustry})` : ''}
- Location: ${business.location.city}, ${business.location.state}
- Services: ${business.services.join(', ')}
- Target Audience: ${business.targetAudience}
- Brand Voice: ${business.brandVoice.join(', ')}
- USP: ${business.usp}
- Content Rules: ${business.contentRules.length > 0 ? business.contentRules.join('; ') : 'None'}

ACCOUNTS:
${accountSummary}

Respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "document": "A 2-3 paragraph strategy overview",
  "pillars": [
    {
      "id": "pillar-1",
      "name": "Pillar Name",
      "description": "What this pillar covers",
      "examples": ["Example post topic 1", "Example topic 2", "Example topic 3"]
    }
  ],
  "samplePosts": [
    {
      "accountId": "account-id-here",
      "content": "Full sample post text",
      "pillar": "Pillar Name"
    }
  ],
  "calendar": [
    {
      "dayOfWeek": 1,
      "accountId": "account-id-here",
      "pillar": "Pillar Name",
      "time": "09:00"
    }
  ]
}

Create 3-5 content pillars. Generate 2 sample posts per account. Create a weekly calendar that respects each account's posting frequency. Use the actual account IDs provided: ${accounts.map((a) => a.id).join(', ')}

CRITICAL RULES FOR ALL CONTENT:
- NEVER reference specific dates, days of the week, weather events, or time-specific events in sample posts.
- NEVER fabricate events, meetings, sponsorships, or customer interactions.
- Posts must be TIMELESS — they should make sense posted on any day.
- For personal accounts: write reflections, lessons, observations about the journey. NOT play-by-play of imaginary days.
- Strictly follow all content rules listed above (especially: no emojis if that's a rule).`

    const result = await generateContent(aiConfig, [
      { role: 'system', content: 'You are a social media content strategist. Always respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ])

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = result.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const strategy: ContentStrategy = JSON.parse(jsonStr)

    return NextResponse.json({ strategy })
  } catch (error) {
    console.error('Strategy generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate strategy' },
      { status: 500 }
    )
  }
}
