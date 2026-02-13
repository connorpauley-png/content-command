import { NextResponse } from 'next/server'
import type { Post, AppConfig, PlatformAccount } from '@/types'

const PLATFORM_GUIDELINES: Record<string, { maxChars: number; style: string }> = {
  twitter: { maxChars: 280, style: 'Concise, punchy, no hashtag spam. 1-2 hashtags max.' },
  instagram: { maxChars: 2200, style: 'Engaging caption with line breaks. 5-15 relevant hashtags at the end.' },
  facebook: { maxChars: 5000, style: 'Conversational, can be longer. Minimal hashtags. Ask questions to drive engagement.' },
  linkedin: { maxChars: 3000, style: 'Professional tone. Industry insights. Use line breaks for readability. 3-5 hashtags.' },
  tiktok: { maxChars: 2200, style: 'Casual, trendy, emoji-friendly. Relevant hashtags.' },
  google_business: { maxChars: 1500, style: 'Local-focused, professional. Include call-to-action. No hashtags.' },
  nextdoor: { maxChars: 2000, style: 'Neighborly, local community tone. Mention the area/neighborhood.' },
}

export async function POST(request: Request) {
  try {
    const { post, targetAccounts, config } = (await request.json()) as {
      post: Post
      targetAccounts: string[]
      config: AppConfig
    }

    if (!post || !targetAccounts?.length || !config) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const accountMap = new Map(config.accounts.map((a: PlatformAccount) => [a.id, a]))
    const results: Post[] = []

    for (const accountId of targetAccounts) {
      const account = accountMap.get(accountId)
      if (!account) continue

      const guidelines = PLATFORM_GUIDELINES[account.platform] ?? PLATFORM_GUIDELINES.facebook

      const systemPrompt = `You are a social media content adapter. Adapt the given post for ${account.platform}.
Platform guidelines: ${guidelines.style}
Max characters: ${guidelines.maxChars}
Brand voice: ${config.business.brandVoice.join(', ')}
Business: ${config.business.name} — ${config.business.industry}
Account personality: ${account.personality}
Account goal: ${account.goal}

Return ONLY the adapted post text. No explanations.`

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.ai.apiKey}`,
        },
        body: JSON.stringify({
          model: config.ai.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Original post (${post.platform}):\n\n${post.content}` },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      const data = await res.json()
      const adaptedContent = data.choices?.[0]?.message?.content?.trim() ?? post.content

      // Extract hashtags from adapted content
      const hashtagMatch = adaptedContent.match(/#\w+/g) ?? []

      const newPost: Post = {
        id: `${Date.now()}-${accountId}-${Math.random().toString(36).slice(2, 8)}`,
        clientId: post.clientId,
        accountId,
        platform: account.platform,
        contentType: post.contentType ?? 'photo',
        status: 'review',
        content: adaptedContent,
        mediaUrls: [...(post.mediaUrls ?? [])], // share same media
        hashtags: hashtagMatch.map((h: string) => h.slice(1)),
        templateData: post.templateData,
        pillar: post.pillar,
        aiGenerated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      results.push(newPost)
    }

    return NextResponse.json({ posts: results })
  } catch (error) {
    console.error('Repurpose error:', error)
    return NextResponse.json({ error: 'Failed to repurpose' }, { status: 500 })
  }
}
