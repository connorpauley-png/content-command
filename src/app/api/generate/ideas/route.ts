import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { CONNOR_VOICE_GUIDE, CONNOR_PERSONAL_EXAMPLES } from '@/lib/connor-examples'
import type { AppConfig } from '@/types'

interface IdeaRequest {
  config: AppConfig
  accountId: string
  count?: number
  theme?: string
}

function safeGet(obj: any, ...keys: string[]): string {
  let val = obj
  for (const k of keys) {
    val = val?.[k]
    if (val === undefined || val === null) return ''
  }
  return String(val)
}

function extractJSON(text: string): any {
  // Try direct parse
  try { return JSON.parse(text) } catch {}
  
  // Try extracting JSON block from markdown code fence
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()) } catch {}
  }
  
  // Try finding first { to last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch {}
  }
  
  // Try finding first [ to last ]
  const aStart = text.indexOf('[')
  const aEnd = text.lastIndexOf(']')
  if (aStart !== -1 && aEnd > aStart) {
    try { return { ideas: JSON.parse(text.slice(aStart, aEnd + 1)) } } catch {}
  }
  
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { config, accountId, count = 10, theme }: IdeaRequest = await req.json()

    if (!config?.ai?.apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 400 })
    }

    const account = config.accounts?.find(a => a.id === accountId)
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const biz = config.business || {} as any
    const voice = (account.voiceOverride?.length) ? account.voiceOverride.join(', ') : (biz.brandVoice || []).join(', ') || 'professional'
    const location = biz.location ? `${biz.location.city || ''}, ${biz.location.state || ''}` : ''
    const services = (biz.services || []).join(', ')
    const rules = (biz.contentRules || []).join('; ')

    const personalityContext = account.personality === 'personal'
      ? 'This is a PERSONAL brand account. Ideas should be about the person behind the business — their journey, lessons, hot takes, lifestyle, mindset.'
      : account.personality === 'both'
      ? 'This account mixes business and personal. Alternate between service-related ideas and personal stories/takes.'
      : 'This is a BUSINESS account. Ideas should drive leads, showcase work, build trust, and educate.'

    const pillarsContext = config.strategy?.pillars?.length
      ? `Content Pillars to rotate through:\n${config.strategy.pillars.map(p => `- ${p.name}: ${p.description}`).join('\n')}`
      : ''

    const examplesContext = (account.personality === 'personal' || account.personality === 'both')
      ? `${CONNOR_VOICE_GUIDE}\n\nVoice examples:\n${(account.examplePosts?.length ? account.examplePosts : CONNOR_PERSONAL_EXAMPLES).slice(0, 3).map(ex => `"${ex}"`).join('\n')}`
      : ''

    const systemPrompt = `You are a content strategist. Generate exactly ${count} content IDEAS for a ${account.platform} account.

${personalityContext}

Business: ${biz.name || 'Unknown'} (${biz.industry || 'general'})
${location ? `Location: ${location}` : ''}
${services ? `Services: ${services}` : ''}
${biz.targetAudience ? `Target Audience: ${biz.targetAudience}` : ''}
${biz.usp ? `USP: ${biz.usp}` : ''}
Voice: ${voice}
Account: @${account.handle}
Goal: ${account.goal || 'engagement'}
${account.contentDescription ? `Account purpose: ${account.contentDescription}` : ''}
${(account.sampleTopics?.length) ? `Topics: ${account.sampleTopics.join(', ')}` : ''}
${pillarsContext}
${examplesContext}
${rules ? `Rules: ${rules}` : ''}
${theme ? `Direction/Theme the user wants: ${theme}` : ''}

Each idea = one sentence concept + a scroll-stopping hook line. NOT full captions.

For each idea, recommend the best content FORMAT and visual ASSET type with brief reasoning.

Available formats: quote_card, before_after, hot_take, x_vs_y, reel, carousel, photo, text, testimonial, stat_card, checklist, crew_spotlight, flyer, numbers_grid, origin_story
Available assets: graphic_template, ai_photo, real_photo, companycam, video_clip, no_media

RULES:
- NO emojis
- Timeless content (no specific dates)
- Mix up formats — variety is key
- Prioritize engagement: controversy, curiosity, relatability, aspiration

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{"ideas":[{"concept":"...","hook":"...","pillar":"...","format":{"contentType":"...","reason":"..."},"assetRecommendation":{"type":"...","description":"...","reason":"..."},"engagementPotential":"high|medium|low","engagementReason":"..."}]}`

    const result = await generateContent(config.ai, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate ${count} content ideas for @${account.handle} on ${account.platform}.${theme ? ` Theme: ${theme}` : ''} Mix educational, controversial, personal, and promotional. Prioritize engagement. Return ONLY valid JSON, no markdown.` },
    ])

    const parsed = extractJSON(result)
    if (!parsed || !Array.isArray(parsed.ideas)) {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: result.slice(0, 500) }, { status: 500 })
    }

    // Normalize ideas — fill in missing fields with defaults
    const ideas = parsed.ideas.map((idea: any) => ({
      concept: idea.concept || idea.title || idea.idea || 'Untitled idea',
      hook: idea.hook || idea.opening || idea.concept || '',
      pillar: idea.pillar || idea.category || '',
      format: {
        contentType: idea.format?.contentType || idea.format?.type || idea.contentType || 'text',
        reason: idea.format?.reason || idea.format?.why || '',
      },
      assetRecommendation: {
        type: idea.assetRecommendation?.type || idea.asset?.type || 'no_media',
        description: idea.assetRecommendation?.description || idea.asset?.description || '',
        reason: idea.assetRecommendation?.reason || idea.asset?.reason || '',
      },
      engagementPotential: idea.engagementPotential || idea.engagement || 'medium',
      engagementReason: idea.engagementReason || '',
    }))

    return NextResponse.json({ ideas })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 })
  }
}
