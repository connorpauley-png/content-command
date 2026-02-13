import { NextRequest, NextResponse } from 'next/server'
import { orchestratePublish } from '@/lib/publishers/orchestrator'
import { ensurePublicUrl } from '@/lib/image-proxy'
import type { NormalizedPost, ConnectedAccount } from '@/lib/publishers/core/types'

export async function POST(req: NextRequest) {
  try {
    const { post, accounts, dryRun } = await req.json()

    if (!post || !accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing post or accounts array' }, { status: 400 })
    }

    // Build NormalizedPost
    const text = post.content + (post.hashtags?.length
      ? '\n\n' + post.hashtags.map((t: string) => `#${t}`).join(' ')
      : '')

    const rawUrls: string[] = post.mediaUrls || []
    const publicUrls = await Promise.all(rawUrls.map((url: string) => ensurePublicUrl(url)))

    const normalizedPost: NormalizedPost = {
      id: post.id || `post-${Date.now()}`,
      text,
      variations: post.variations || undefined,
      media: publicUrls.map((url: string) => ({ url, type: 'image' as const })),
      scheduling: null,
      metadata: { generatedBy: post.generatedBy || 'manual' },
    }

    // Build ConnectedAccounts
    const connectedAccounts: ConnectedAccount[] = accounts.map((a: any) => ({
      platform: a.platform,
      accountType: a.accountType || 'personal',
      accessToken: a.credentials?.accessToken || a.credentials?.pageToken || '',
      platformAccountId: a.credentials?.pageId || a.credentials?.igAccountId || a.credentials?.businessAccountId || a.platformAccountId || '',
      metadata: a.credentials || {},
    }))

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        wouldPublish: {
          post: normalizedPost,
          platforms: connectedAccounts.map(a => a.platform),
        },
      })
    }

    const result = await orchestratePublish(normalizedPost, connectedAccounts)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
