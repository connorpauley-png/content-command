import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { CONNOR_PERSONAL_EXAMPLES, CONNOR_VOICE_GUIDE } from '@/lib/connor-examples'
import type { AppConfig, Post } from '@/types'

interface GeneratedItem {
  content: string
  hashtags?: string[]
  suggestedDate?: string
  suggestedTime?: string
  imagePrompt?: string
  pillar?: string
}

export async function POST(req: NextRequest) {
  try {
    const { config, accountId, count, timeRange }: {
      config: AppConfig
      accountId: string
      count: number
      timeRange: 'this_week' | 'next_week' | 'this_month'
    } = await req.json()

    if (!config?.ai?.apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 400 })
    }

    const account = config.accounts.find(a => a.id === accountId)
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const biz = config.business
    const strategy = config.strategy

    const now = new Date()
    const startDate = new Date()
    let endDate = new Date()

    if (timeRange === 'this_week') {
      const dayOfWeek = now.getDay()
      startDate.setDate(now.getDate() + (dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 1))
      endDate.setDate(startDate.getDate() + 6)
    } else if (timeRange === 'next_week') {
      const dayOfWeek = now.getDay()
      startDate.setDate(now.getDate() + (7 - dayOfWeek + 1))
      endDate.setDate(startDate.getDate() + 6)
    } else {
      startDate.setDate(now.getDate() + 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    const voice = (account.voiceOverride && account.voiceOverride.length > 0) ? account.voiceOverride.join(', ') : biz.brandVoice.join(', ')
    const personalityContext = account.personality === 'personal'
      ? 'This is a PERSONAL account. Write as the person behind the business — share stories, life updates, lessons, behind the scenes. Do NOT write promotional/business content.'
      : account.personality === 'both'
      ? 'This account mixes business and personal. Alternate between service-related posts and personal stories/updates.'
      : 'This is a BUSINESS account. Focus on services, work examples, customer value, and driving leads.'

    const systemPrompt = `You are a social media content creator. Generate ${count} posts for ${account.platform}.

${personalityContext}

Business Context: ${biz.name} (${biz.industry})
Location: ${biz.location.city}, ${biz.location.state}
Services: ${biz.services.join(', ')}
Target Audience: ${biz.targetAudience}
USP: ${biz.usp}
Voice/Tone: ${voice}
${biz.contentRules.length > 0 ? `Content Rules: ${biz.contentRules.join('; ')}` : ''}

Account: @${account.handle} on ${account.platform}
Goal: ${account.goal}
Personality: ${account.personality || 'business'}
${account.contentDescription ? `Account Description: ${account.contentDescription}` : ''}
${(account.sampleTopics && account.sampleTopics.length > 0) ? `Topics to post about: ${account.sampleTopics.join(', ')}` : ''}
Content Types: ${account.contentTypes.join(', ')}
Hashtag Strategy: ${account.hashtagStrategy}
${strategy?.pillars?.length ? `Content Pillars: ${strategy.pillars.map(p => `${p.name}: ${p.description}`).join('; ')}` : ''}

${(account.personality === 'personal' || account.personality === 'both') ? (() => {
      const examples = (account.examplePosts && account.examplePosts.length > 0) ? account.examplePosts : CONNOR_PERSONAL_EXAMPLES
      return `${CONNOR_VOICE_GUIDE}

REAL EXAMPLES OF THE VOICE TO MATCH (study these carefully — this is the EXACT tone and style to replicate):
${examples.map((ex: string, i: number) => `Example ${i + 1}:\n"${ex}"`).join('\n\n')}

CRITICAL: Match this exact voice and style. Do NOT make up events, sponsorships, storms, weather events, or announcements. Do NOT use emojis. Do NOT reference specific days or dates — posts must be TIMELESS and work on any day. Write general reflections, lessons, and observations about the entrepreneurship journey.`
    })() : ''}

Date Range: ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}

Generate exactly ${count} varied posts. Mix content pillars and types. Space them evenly across the date range.

Respond ONLY with valid JSON array (no markdown):
[{
  "content": "post text",
  "hashtags": ["tag1", "tag2"],
  "suggestedDate": "YYYY-MM-DD",
  "suggestedTime": "HH:MM",
  "imagePrompt": "image description",
  "pillar": "pillar name"
}]`

    const result = await generateContent(config.ai, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate ${count} ${account.platform} posts for @${account.handle}. Spread across ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}.\n\nCRITICAL REMINDERS:\n- This account's personality is "${account.personality || 'business'}" — generate content accordingly\n- ${account.contentDescription ? `This account is for: ${account.contentDescription}` : ''}\n- STRICTLY follow ALL content rules listed above. If a rule says "no emojis" then use ZERO emojis anywhere.` },
    ])

    let parsed: GeneratedItem[]
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/)
      parsed = JSON.parse(jsonMatch?.[0] || result)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: result }, { status: 500 })
    }

    const posts: Post[] = parsed.map(item => {
      return {
        id: crypto.randomUUID(),
        clientId: config.clientId,
        accountId: account.id,
        platform: account.platform,
        status: 'idea' as const,
        content: item.content,
        mediaUrls: [],
        hashtags: item.hashtags || [],
        scheduledAt: undefined,
        aiGenerated: true,
        pillar: item.pillar,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    })

    return NextResponse.json({ posts, imagePrompts: parsed.map(p => p.imagePrompt) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
