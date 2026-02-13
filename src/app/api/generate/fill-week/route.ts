import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { CONNOR_PERSONAL_EXAMPLES, CONNOR_VOICE_GUIDE } from '@/lib/connor-examples'
import type { AppConfig, Post, CalendarSlot, ContentType, TemplateData } from '@/types'

const CONTENT_TYPE_INSTRUCTIONS: Record<string, string> = {
  quote_card: 'Dark background style. One powerful line or bold statement. Punchy and quotable.',
  before_after: 'Caption for a before/after transformation. Highlight the contrast.',
  testimonial: 'Format a customer review or success story with specific results.',
  stat_card: 'Lead with one impressive metric/number. The stat IS the post.',
  flyer: 'Promotional announcement with a clear CTA.',
  checklist: 'Numbered actionable tips (3-7 items). Listicle format.',
  hot_take: 'Polarizing or contrarian statement. End with "Agree?" or engagement question.',
  x_vs_y: 'Compare two concepts side by side. Show the contrast clearly.',
  origin_story: 'Multi-paragraph narrative. Personal, vulnerable, real.',
  crew_spotlight: 'Feature a team member. Their role, personality, fun fact.',
  day_in_life: 'Walk through a typical day. Behind the scenes, real moments.',
  timelapse: 'Caption for a timelapse video. Describe the transformation.',
  tutorial: 'How-to or educational content. Step by step.',
  podcast_clip: 'Caption for a podcast clip. Pull quote + context.',
  photo: 'Standard photo post with engaging caption.',
  video: 'Video post caption. Hook in first line.',
  reel: 'Short-form video caption. Punchy.',
  text: 'Text-only post.',
  story: 'Story-format content. Casual, in-the-moment.',
  carousel: 'Multi-slide content.',
}

const TEMPLATE_RENDERABLE_TYPES = new Set([
  'quote_card', 'before_after', 'testimonial', 'stat_card',
  'flyer', 'checklist', 'hot_take', 'x_vs_y'
])

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface GeneratedSlotItem {
  slotIndex: number
  content: string
  contentType: ContentType
  hashtags?: string[]
  imagePrompt?: string
  pillar?: string
  templateData?: TemplateData
}

export async function POST(req: NextRequest) {
  try {
    const { config, weekOffset = 0 }: {
      config: AppConfig
      weekOffset?: number  // 0 = this week, 1 = next week
    } = await req.json()

    if (!config?.ai?.apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 400 })
    }

    const schedule = config.weeklySchedule
    if (!schedule || !schedule.slots.length) {
      return NextResponse.json({ error: 'No weekly schedule configured' }, { status: 400 })
    }

    const biz = config.business

    // Calculate the target week's dates
    const now = new Date()
    const currentDay = now.getDay()
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset + (weekOffset * 7))

    // Build slot descriptions with actual dates
    const slotDescriptions = schedule.slots.map((slot: CalendarSlot, idx: number) => {
      const account = config.accounts.find(a => a.id === slot.accountId)
      if (!account) return null

      const slotDate = new Date(monday)
      const daysFromMonday = slot.dayOfWeek === 0 ? 6 : slot.dayOfWeek - 1
      slotDate.setDate(monday.getDate() + daysFromMonday)

      return {
        idx,
        slot,
        account,
        date: slotDate.toISOString().slice(0, 10),
        description: `Slot ${idx}: ${DAY_NAMES[slot.dayOfWeek]} ${slotDate.toISOString().slice(0, 10)} at ${slot.time} — @${account.handle} (${account.platform}) — contentType: ${slot.contentType}${slot.pillar ? ` — pillar: ${slot.pillar}` : ''}`
      }
    }).filter(Boolean) as { idx: number; slot: CalendarSlot; account: typeof config.accounts[0]; date: string; description: string }[]

    if (!slotDescriptions.length) {
      return NextResponse.json({ error: 'No valid slots (accounts not found)' }, { status: 400 })
    }

    // Group by account for voice context
    const accountIds = Array.from(new Set(slotDescriptions.map(s => s.account.id)))
    const accountContexts = accountIds.map(id => {
      const account = config.accounts.find(a => a.id === id)!
      const voice = (account.voiceOverride?.length) ? account.voiceOverride.join(', ') : biz.brandVoice.join(', ')
      const personalityContext = account.personality === 'personal'
        ? 'PERSONAL account — write as the person, not the business.'
        : account.personality === 'both'
        ? 'Mixed account — alternate business and personal.'
        : 'BUSINESS account — focus on services and leads.'
      
      let exampleSection = ''
      if (account.personality === 'personal' || account.personality === 'both') {
        const examples = (account.examplePosts?.length) ? account.examplePosts : CONNOR_PERSONAL_EXAMPLES
        exampleSection = `${CONNOR_VOICE_GUIDE}\nExamples:\n${examples.map((ex: string) => `"${ex}"`).join('\n')}`
      }

      return `@${account.handle} (${account.platform}): Voice=${voice}. ${personalityContext}${account.contentDescription ? ` Purpose: ${account.contentDescription}` : ''}${exampleSection ? `\n${exampleSection}` : ''}`
    }).join('\n\n')

    // Content type instructions for used types
    const usedTypes = Array.from(new Set(slotDescriptions.map(s => s.slot.contentType)))
    const typeInstructions = usedTypes
      .map(t => `- ${t}: ${CONTENT_TYPE_INSTRUCTIONS[t] || 'Standard format.'}`)
      .join('\n')

    const systemPrompt = `You are a social media content creator filling a weekly content calendar.

Business: ${biz.name} (${biz.industry})
Location: ${biz.location.city}, ${biz.location.state}
Services: ${biz.services.join(', ')}
Target Audience: ${biz.targetAudience}
USP: ${biz.usp}
${biz.contentRules.length > 0 ? `Content Rules: ${biz.contentRules.join('; ')}` : ''}
${config.strategy?.pillars?.length ? `Content Pillars: ${config.strategy.pillars.map(p => `${p.name}: ${p.description}`).join('; ')}` : ''}

ACCOUNTS:
${accountContexts}

CONTENT TYPE FORMATS:
${typeInstructions}

For template-renderable types (quote_card, before_after, testimonial, stat_card, flyer, checklist, hot_take, x_vs_y), include a templateData object:
- quote_card: { quote, author? }
- stat_card: { stat, statLabel, headline? }
- testimonial: { quote, author, rating? }
- checklist: { headline, items[] }
- hot_take: { headline }
- x_vs_y: { headline, comparison: { left, right } }
- before_after: { headline, subtext? }
- flyer: { headline, subtext }

WEEKLY SLOTS TO FILL:
${slotDescriptions.map(s => s.description).join('\n')}

Generate exactly one post per slot. Each post must match the slot's contentType and account.
Do NOT use emojis unless the account voice specifically calls for it.
Do NOT reference specific dates — posts should be timeless.

Respond ONLY with valid JSON array (no markdown):
[{
  "slotIndex": 0,
  "content": "post text",
  "contentType": "quote_card",
  "hashtags": ["tag1"],
  "imagePrompt": "description",
  "pillar": "pillar name",
  "templateData": { ... }
}]`

    const result = await generateContent(config.ai, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Fill all ${slotDescriptions.length} slots for the week of ${monday.toISOString().slice(0, 10)}. One post per slot. Match each slot's contentType and account exactly.` },
    ])

    let parsed: GeneratedSlotItem[]
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/)
      parsed = JSON.parse(jsonMatch?.[0] || result)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: result }, { status: 500 })
    }

    const posts: Post[] = parsed.map((item, i) => {
      const slotInfo = slotDescriptions[item.slotIndex ?? i]
      if (!slotInfo) return null

      const contentType: ContentType = item.contentType || slotInfo.slot.contentType || 'photo'

      return {
        id: crypto.randomUUID(),
        clientId: config.clientId,
        accountId: slotInfo.account.id,
        platform: slotInfo.account.platform,
        contentType,
        status: 'idea' as const,
        content: item.content,
        mediaUrls: [],
        hashtags: item.hashtags || [],
        templateData: TEMPLATE_RENDERABLE_TYPES.has(contentType) ? item.templateData : undefined,
        scheduledAt: `${slotInfo.date}T${slotInfo.slot.time}:00`,
        aiGenerated: true,
        pillar: item.pillar || slotInfo.slot.pillar,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }).filter(Boolean) as Post[]

    return NextResponse.json({
      posts,
      imagePrompts: parsed.map(p => p.imagePrompt),
      weekOf: monday.toISOString().slice(0, 10),
      slotsRequested: slotDescriptions.length,
      postsGenerated: posts.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
