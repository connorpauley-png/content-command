import { NextRequest, NextResponse } from 'next/server'
import { generateContent } from '@/lib/ai'
import { CONNOR_VOICE_GUIDE, CONNOR_PERSONAL_EXAMPLES } from '@/lib/connor-examples'
import type { AppConfig, ContentType, Post } from '@/types'

interface BuildRequest {
  config: AppConfig
  accountId: string
  idea: {
    concept: string
    hook: string
    pillar?: string
    format: { contentType: string; reason: string }
    assetRecommendation: { type: string; description: string; reason: string }
  }
}

// Smart logic: platform-specific rules
const PLATFORM_RULES: Record<string, { maxChars: number; hashtagLimit: number; notes: string }> = {
  instagram: { maxChars: 2200, hashtagLimit: 8, notes: 'First line is the hook (gets cut at ~125 chars). Hashtags at end. Reels outperform photos.' },
  twitter: { maxChars: 280, hashtagLimit: 2, notes: 'Punchy and concise. Threads for longer content. No hashtag spam.' },
  linkedin: { maxChars: 3000, hashtagLimit: 5, notes: 'Line breaks after every 1-2 sentences. Professional but personal. Hook in first line.' },
  facebook: { maxChars: 5000, hashtagLimit: 3, notes: 'Conversational. Questions drive comments. Shorter posts outperform.' },
  tiktok: { maxChars: 2200, hashtagLimit: 5, notes: 'Captions are secondary to video. Keep short.' },
  google_business: { maxChars: 1500, hashtagLimit: 0, notes: 'Local-focused. Include CTA and contact info.' },
  nextdoor: { maxChars: 2000, hashtagLimit: 0, notes: 'Neighborhood-focused. Helpful > promotional. No hashtags.' },
}

// Smart logic: content type → template data mapping
const TEMPLATE_TYPES = new Set([
  'quote_card', 'before_after', 'testimonial', 'stat_card', 'flyer',
  'checklist', 'hot_take', 'x_vs_y', 'crew_spotlight', 'numbers_grid'
])

export async function POST(req: NextRequest) {
  try {
    const { config, accountId, idea }: BuildRequest = await req.json()

    if (!config?.ai?.apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 400 })
    }

    const account = config.accounts.find(a => a.id === accountId)
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const biz = config.business
    const voice = (account.voiceOverride?.length) ? account.voiceOverride.join(', ') : biz.brandVoice.join(', ')
    const platformRules = PLATFORM_RULES[account.platform] || PLATFORM_RULES.instagram
    const contentType = idea.format.contentType as ContentType
    const isTemplate = TEMPLATE_TYPES.has(contentType)

    const examplesContext = (account.personality === 'personal' || account.personality === 'both')
      ? `${CONNOR_VOICE_GUIDE}\n\nVoice examples:\n${(account.examplePosts?.length ? account.examplePosts : CONNOR_PERSONAL_EXAMPLES).slice(0, 3).map(ex => `"${ex}"`).join('\n')}`
      : ''

    // Content-type-specific instructions
    const formatInstructions: Record<string, string> = {
      quote_card: 'Write ONE powerful statement. Short. Bold. No fluff. This goes on a dark background as large text. Max 15 words.',
      hot_take: 'Write a polarizing statement that forces people to agree or disagree. End the caption with "Agree?" or a similar engagement CTA.',
      x_vs_y: 'Frame as a clear comparison. Title format: "X vs Y". Then explain each side briefly. This is educational and drives discussion.',
      before_after: 'Write a caption that highlights the transformation. What was wrong before, what it looks like now, and what service made it happen.',
      testimonial: 'Format a customer review as a post. Include the star rating, the quote, and a brief response/thank you.',
      stat_card: 'Lead with the impressive number. One sentence of context. Let the stat speak for itself.',
      checklist: 'Number each item. Keep each point to one line. Educational and actionable. People save checklists.',
      flyer: 'Promotional format. Service name, key benefits (2-3), clear CTA with contact info. Keep it clean and direct.',
      crew_spotlight: 'Feature a team member. Name, role, one personal detail, one thing they bring to the team. Humanizes the brand.',
      numbers_grid: 'Pick 3-4 impressive stats. Each needs a value and a label. Let the numbers tell the story.',
      origin_story: 'Tell a story in slides. Hook → Backstory → Struggle → Turning point → Where you are now → Lesson. Each slide = one idea.',
      carousel: 'Each slide should stand alone but build a narrative. First slide = hook that makes people swipe. Last slide = CTA.',
      reel: 'Write a script/talking points for a 30-60 second video. Hook in first 3 seconds. One clear takeaway.',
      photo: 'Caption that complements the image. Hook first, story/context second, CTA last.',
      text: 'Pure text post. Short sentences. Line breaks between thoughts. Build tension or deliver value.',
    }

    const templateDataInstructions = isTemplate ? `

ALSO generate templateData for rendering the graphic. Based on content type:
- quote_card: { "quote": "the statement", "attribution": "name" }
- hot_take: { "statement": "the take", "cta": "Agree?" }
- x_vs_y: { "leftTitle": "X", "rightTitle": "Y", "leftPoints": ["point1"], "rightPoints": ["point1"] }
- stat_card: { "value": "4.9", "label": "Google Rating", "subtitle": "optional context" }
- checklist: { "title": "List Title", "items": ["item1", "item2", "item3"] }
- flyer: { "headline": "Service Name", "bullets": ["benefit1", "benefit2"], "cta": "Call or Text", "phone": "318-600-9123" }
- numbers_grid: { "stats": [{"value": "27", "label": "Employees"}, ...] }
- testimonial: { "quote": "review text", "name": "Customer Name", "location": "Neighborhood", "rating": 5 }
- crew_spotlight: { "name": "Name", "role": "Role", "quote": "Something they said" }
` : ''

    const systemPrompt = `You are a social media content writer. Build a FULL post from this approved idea.

IDEA: ${idea.concept}
HOOK: ${idea.hook}
CONTENT TYPE: ${contentType}
ASSET RECOMMENDATION: ${idea.assetRecommendation.type} — ${idea.assetRecommendation.description}

Business: ${biz.name} (${biz.industry})
Location: ${biz.location.city}, ${biz.location.state}
Services: ${biz.services.join(', ')}
Voice: ${voice}
Platform: ${account.platform} (@${account.handle})
${account.contentDescription ? `Account purpose: ${account.contentDescription}` : ''}
${examplesContext}
${biz.contentRules.length > 0 ? `Rules: ${biz.contentRules.join('; ')}` : ''}

PLATFORM RULES for ${account.platform}:
- Max characters: ${platformRules.maxChars}
- Max hashtags: ${platformRules.hashtagLimit}
- ${platformRules.notes}

FORMAT INSTRUCTIONS:
${formatInstructions[contentType] || 'Write an engaging post appropriate for this content type.'}
${templateDataInstructions}

CRITICAL:
- NO emojis anywhere in caption or hashtags
- Use the HOOK as the first line (or adapt it to be even better)
- Hashtags should be hyperlocal and relevant (not generic like #business #success)
- Caption must work for ${account.platform} specifically
- TIMELESS content — no dates, no "this week", no event references unless specified

Respond ONLY with valid JSON:
{
  "caption": "the full post caption",
  "hashtags": ["hashtag1", "hashtag2"],
  "contentType": "${contentType}",
  ${isTemplate ? '"templateData": { ... },' : ''}
  "imagePrompt": "if AI photo needed, describe the ideal image. Otherwise null",
  "assetNotes": "specific guidance on what visual to use and why",
  "platformTips": "any platform-specific optimization notes"
}`

    const result = await generateContent(config.ai, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Build the full post for this idea: "${idea.concept}". Make it scroll-stopping.` },
    ])

    let parsed: {
      caption: string
      hashtags: string[]
      contentType: string
      templateData?: Record<string, unknown>
      imagePrompt?: string | null
      assetNotes: string
      platformTips: string
    }

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch?.[0] || result)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: result }, { status: 500 })
    }

    // Build the Post object with asset info baked in
    const assetType = idea.assetRecommendation?.type || (isTemplate ? 'graphic_template' : 'no_media')

    const post: Post = {
      id: crypto.randomUUID(),
      clientId: config.clientId,
      accountId: account.id,
      platform: account.platform,
      contentType: (parsed.contentType as ContentType) || contentType,
      status: 'idea',
      content: parsed.caption,
      mediaUrls: [],
      hashtags: parsed.hashtags || [],
      templateData: parsed.templateData ? {
        template: contentType.replace(/_/g, '-'),
        ...parsed.templateData,
        brandColors: {
          primary: biz.brandColors?.primary || '#254421',
          accent: biz.brandColors?.accent || '#e2b93b',
          background: biz.brandColors?.background || '#0a0a0a',
          text: biz.brandColors?.text || '#ffffff',
        }
      } : undefined,
      pillar: idea.pillar,
      aiGenerated: true,
      assetType: assetType as Post['assetType'],
      assetNotes: parsed.assetNotes || idea.assetRecommendation?.description,
      imagePrompt: parsed.imagePrompt || undefined,
      platformTips: parsed.platformTips || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      post,
      assetNotes: post.assetNotes,
      platformTips: post.platformTips,
      imagePrompt: post.imagePrompt,
      isTemplateType: isTemplate,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 })
  }
}
