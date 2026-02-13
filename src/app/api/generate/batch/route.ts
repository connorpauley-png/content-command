import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { CONNOR_PERSONAL_EXAMPLES, CONNOR_VOICE_GUIDE } from '@/lib/connor-examples'
import type { AppConfig, Post, ContentType, TemplateData } from '@/types'

const CONTENT_TYPE_INSTRUCTIONS: Record<string, string> = {
  quote_card: 'Dark background style. One powerful line or bold statement. No fluff — punchy and quotable.',
  before_after: 'Caption for a before/after transformation. Highlight the contrast. Include what was done.',
  testimonial: 'Format a customer review or success story. Include the customer sentiment and specific results.',
  stat_card: 'Lead with one impressive metric/number. Follow with brief context. The stat IS the post.',
  flyer: 'Promotional announcement with a clear CTA. Event, sale, or service push. Include date/details if relevant.',
  checklist: 'Numbered actionable tips (3-7 items). Each item is concise. Listicle format.',
  hot_take: 'Polarizing or contrarian statement. End with "Agree?" or an engagement question. Be bold.',
  x_vs_y: 'Compare two concepts side by side (e.g., "Employee Mindset vs Owner Mindset"). Show the contrast clearly.',
  origin_story: 'Multi-paragraph narrative about how it started. Personal, vulnerable, real. Good for carousel.',
  crew_spotlight: 'Feature a team member. Their role, personality, fun fact. Humanize the brand.',
  day_in_life: 'Walk through a typical day. Behind the scenes, real moments, not polished.',
  timelapse: 'Caption for a timelapse video. Describe the transformation or process shown.',
  tutorial: 'How-to or educational content. Step by step. Teach something valuable.',
  podcast_clip: 'Caption for a podcast or talking-head clip. Pull quote + context.',
  photo: 'Standard photo post with engaging caption.',
  video: 'Video post caption. Hook in first line.',
  reel: 'Short-form video caption. Punchy, trending-aware.',
  text: 'Text-only post. The writing IS the content.',
  story: 'Story-format content. Casual, in-the-moment.',
  carousel: 'Multi-slide content. Each slide builds on the last.',
}

const TEMPLATE_RENDERABLE_TYPES = new Set([
  'quote_card', 'before_after', 'testimonial', 'stat_card',
  'flyer', 'checklist', 'hot_take', 'x_vs_y'
])

interface GeneratedItem {
  content: string
  contentType: ContentType
  hashtags?: string[]
  suggestedDate?: string
  suggestedTime?: string
  imagePrompt?: string
  pillar?: string
  templateData?: TemplateData
}

export async function POST(req: NextRequest) {
  try {
    const { config, accountId, count, timeRange, contentTypes }: {
      config: AppConfig
      accountId: string
      count: number
      timeRange: 'this_week' | 'next_week' | 'this_month'
      contentTypes?: ContentType[]
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

    // Build content type instructions for the prompt
    const availableTypes = contentTypes && contentTypes.length > 0
      ? contentTypes
      : account.contentTypes
    
    const typeInstructions = availableTypes
      .map(t => `- ${t}: ${CONTENT_TYPE_INSTRUCTIONS[t] || 'Standard post format.'}`)
      .join('\n')

    const templateInstructions = `
For these content types, also generate a "templateData" object for visual rendering:
- quote_card: { quote: "the quote text", author: "attribution (optional)" }
- before_after: { headline: "Project Title", subtext: "Description of work" }
- testimonial: { quote: "customer quote", author: "Customer Name", rating: 5 }
- stat_card: { stat: "the number", statLabel: "what the number means", headline: "context" }
- flyer: { headline: "Main headline", subtext: "Details/CTA" }
- checklist: { headline: "List title", items: ["item 1", "item 2", ...] }
- hot_take: { headline: "The hot take statement" }
- x_vs_y: { headline: "X vs Y", comparison: { left: "X description", right: "Y description" } }
`

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
Hashtag Strategy: ${account.hashtagStrategy}
${strategy?.pillars?.length ? `Content Pillars: ${strategy.pillars.map(p => `${p.name}: ${p.description}`).join('; ')}` : ''}

CONTENT TYPES TO USE (vary across these):
${typeInstructions}

${templateInstructions}

${(account.personality === 'personal' || account.personality === 'both') ? (() => {
      const examples = (account.examplePosts && account.examplePosts.length > 0) ? account.examplePosts : CONNOR_PERSONAL_EXAMPLES
      return `${CONNOR_VOICE_GUIDE}

REAL EXAMPLES OF THE VOICE TO MATCH (study these carefully — this is the EXACT tone and style to replicate):
${examples.map((ex: string, i: number) => `Example ${i + 1}:\n"${ex}"`).join('\n\n')}

CRITICAL: Match this exact voice and style. Do NOT make up events, sponsorships, storms, weather events, or announcements. Do NOT use emojis. Do NOT reference specific days or dates — posts must be TIMELESS and work on any day. Write general reflections, lessons, and observations about the entrepreneurship journey.`
    })() : ''}

Date Range: ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}

Generate exactly ${count} varied posts. Mix content types and pillars. Space them evenly across the date range.

IMPORTANT: Each post MUST include a "contentType" field specifying which content type it is.
Only use content types from the list above.

Respond ONLY with valid JSON array (no markdown):
[{
  "content": "post text",
  "contentType": "quote_card",
  "hashtags": ["tag1", "tag2"],
  "suggestedDate": "YYYY-MM-DD",
  "suggestedTime": "HH:MM",
  "imagePrompt": "image description",
  "pillar": "pillar name",
  "templateData": { ... }
}]`

    const result = await generateContent(config.ai, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate ${count} ${account.platform} posts for @${account.handle}. Spread across ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)}.\n\nCRITICAL REMINDERS:\n- This account's personality is "${account.personality || 'business'}" — generate content accordingly\n- ${account.contentDescription ? `This account is for: ${account.contentDescription}` : ''}\n- STRICTLY follow ALL content rules listed above. If a rule says "no emojis" then use ZERO emojis anywhere.\n- Every post MUST have a contentType field from: ${availableTypes.join(', ')}` },
    ])

    let parsed: GeneratedItem[]
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/)
      parsed = JSON.parse(jsonMatch?.[0] || result)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: result }, { status: 500 })
    }

    const posts: Post[] = parsed.map(item => {
      const contentType: ContentType = item.contentType || 'photo'
      return {
        id: crypto.randomUUID(),
        clientId: config.clientId,
        accountId: account.id,
        platform: account.platform,
        contentType,
        status: 'idea' as const,
        content: item.content,
        mediaUrls: [],
        hashtags: item.hashtags || [],
        templateData: TEMPLATE_RENDERABLE_TYPES.has(contentType) ? item.templateData : undefined,
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
