import { NextRequest, NextResponse } from 'next/server'
import { generateSmartConfig, getIndustryTemplate } from '@/lib/setup-data'
import type { AppConfig } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { industry, businessName, location, services } = body as {
      industry: string
      businessName: string
      location: string
      services: string[]
    }

    if (!industry || !businessName) {
      return NextResponse.json({ error: 'industry and businessName are required' }, { status: 400 })
    }

    const template = getIndustryTemplate(industry)
    if (!template) {
      return NextResponse.json({ error: `Unknown industry: ${industry}. Use "generic" for unsupported industries.` }, { status: 400 })
    }

    // Parse location string into city/state
    const [city, state] = (location ?? '').split(',').map(s => s.trim())

    const config = generateSmartConfig(industry, {
      businessName,
      industry,
      location: { city: city || '', state: state || '' },
      services: services ?? [],
    })

    // Enhance with AI if OpenAI key is available
    const aiKey = process.env.OPENAI_API_KEY
    if (aiKey && config.strategy) {
      try {
        const aiConfig = await enhanceWithAI(aiKey, businessName, template.industry, services ?? [], config)
        return NextResponse.json({ config: aiConfig, template, aiEnhanced: true })
      } catch {
        // Fall through to non-AI response
      }
    }

    return NextResponse.json({ config, template, aiEnhanced: false })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 })
  }
}

async function enhanceWithAI(
  apiKey: string,
  businessName: string,
  industry: string,
  services: string[],
  baseConfig: Partial<AppConfig>
): Promise<Partial<AppConfig>> {
  const prompt = `You are a social media strategist. A ${industry} business called "${businessName}" offers: ${services.join(', ')}.

Based on their existing content pillars: ${baseConfig.strategy?.pillars.map(p => p.name).join(', ')}

Generate 3 customized sample post ideas for each pillar that are specific to this business (mention their name and services). Return JSON only:
{ "customPosts": { "pillarId": ["post1", "post2", "post3"] } }`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    }),
  })

  if (!res.ok) throw new Error('AI enhancement failed')
  const data = await res.json()
  const parsed = JSON.parse(data.choices[0].message.content)

  // Merge AI posts into strategy
  if (parsed.customPosts && baseConfig.strategy) {
    const aiSamplePosts = Object.entries(parsed.customPosts).flatMap(([pillarId, posts]) =>
      (posts as string[]).map(content => ({
        accountId: '__default__',
        content,
        pillar: pillarId,
      }))
    )
    baseConfig.strategy.samplePosts = [
      ...baseConfig.strategy.samplePosts,
      ...aiSamplePosts,
    ]
  }

  return baseConfig
}
