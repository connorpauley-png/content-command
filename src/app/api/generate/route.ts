import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { CONNOR_PERSONAL_EXAMPLES, CONNOR_VOICE_GUIDE } from '@/lib/connor-examples'
import type { AppConfig, Post } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { config, accountId }: { config: AppConfig; accountId: string } = await req.json()

    if (!config?.ai?.apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 400 })
    }

    const account = config.accounts.find(a => a.id === accountId)
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const biz = config.business
    const strategy = config.strategy

    const voice = (account.voiceOverride && account.voiceOverride.length > 0) ? account.voiceOverride.join(', ') : biz.brandVoice.join(', ')
    const personalityContext = account.personality === 'personal'
      ? 'This is a PERSONAL account. Write as the person behind the business — share stories, life updates, lessons, behind the scenes. Do NOT write promotional/business content.'
      : account.personality === 'both'
      ? 'This account mixes business and personal. Alternate between service-related posts and personal stories/updates.'
      : 'This is a BUSINESS account. Focus on services, work examples, customer value, and driving leads.'

    const systemPrompt = `You are a social media content creator. Generate a single post for ${account.platform}.

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
${strategy?.pillars?.length ? `Content Pillars: ${strategy.pillars.map(p => p.name).join(', ')}` : ''}

${(account.personality === 'personal' || account.personality === 'both') ? (() => {
      const examples = (account.examplePosts && account.examplePosts.length > 0) ? account.examplePosts : CONNOR_PERSONAL_EXAMPLES
      return `${CONNOR_VOICE_GUIDE}

REAL EXAMPLES OF THE VOICE TO MATCH (study these carefully):
${examples.slice(0, 3).map((ex: string, i: number) => `Example ${i + 1}:\n"${ex}"`).join('\n\n')}

CRITICAL: Match this exact voice and style. Do NOT make up events, storms, weather, or announcements. Do NOT use emojis. Do NOT reference specific days or dates — posts must be TIMELESS and work on any day. Write general reflections, lessons, and observations about the entrepreneurship journey.`
    })() : ''}

Respond ONLY with valid JSON (no markdown):
{
  "content": "the post text (platform-appropriate length and tone)",
  "hashtags": ["hashtag1", "hashtag2"],
  "suggestedTime": "HH:MM",
  "imagePrompt": "description of ideal accompanying image",
  "pillar": "content pillar name if applicable"
}`

    const result = await generateContent(config.ai, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate a ${account.platform} post for @${account.handle}. Make it engaging and on-brand.\n\nCRITICAL REMINDERS:\n- This account's personality is "${account.personality || 'business'}" — generate content accordingly\n- ${account.contentDescription ? `This account is for: ${account.contentDescription}` : ''}\n- STRICTLY follow ALL content rules listed above. If a rule says "no emojis" then use ZERO emojis anywhere.` },
    ])

    let parsed: { content: string; hashtags?: string[]; suggestedTime?: string; imagePrompt?: string; pillar?: string }
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] || result)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: result }, { status: 500 })
    }

    const post: Post = {
      id: crypto.randomUUID(),
      clientId: config.clientId,
      accountId: account.id,
      platform: account.platform,
      status: 'idea',
      content: parsed.content,
      mediaUrls: [],
      hashtags: parsed.hashtags || [],
      scheduledAt: undefined,
      aiGenerated: true,
      pillar: parsed.pillar,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ post, imagePrompt: parsed.imagePrompt })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
