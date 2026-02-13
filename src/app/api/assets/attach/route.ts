import { NextResponse } from 'next/server'

const COMPANYCAM_TOKEN = process.env.COMPANYCAM_API_TOKEN || ''
const COMPANYCAM_BASE = 'https://api.companycam.com/v2'
const ASTRIA_API_KEY = process.env.ASTRIA_API_KEY || ''
const TUNE_ID = '4049178'

type AssetSource = 'companycam' | 'template' | 'astria' | 'upload'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { source, photoIds, urls, prompt, templateData, templateName } = body as {
      postId: string
      source: AssetSource
      photoIds?: string[]
      urls?: string[]
      prompt?: string
      templateData?: Record<string, unknown>
      templateName?: string
    }

    if (!source) {
      return NextResponse.json({ error: 'source is required' }, { status: 400 })
    }

    // CompanyCam: fetch photo URLs by IDs
    if (source === 'companycam') {
      if (!photoIds || photoIds.length === 0) {
        return NextResponse.json({ error: 'photoIds required for companycam source' }, { status: 400 })
      }

      const mediaUrls: string[] = []
      for (const id of photoIds) {
        const res = await fetch(`${COMPANYCAM_BASE}/photos/${id}`, {
          headers: { Authorization: `Bearer ${COMPANYCAM_TOKEN}` },
        })
        if (res.ok) {
          const photo = await res.json()
          const uris = photo.uris as Array<{ type: string; uri: string }> | undefined
          const photoUri = uris?.find((u: { type: string }) => u.type === 'photo_url') || uris?.[0]
          if (photoUri) mediaUrls.push(photoUri.uri)
        }
      }
      return NextResponse.json({ mediaUrls })
    }

    // Template: render via internal API
    if (source === 'template') {
      if (!templateData) {
        return NextResponse.json({ error: 'templateData required for template source' }, { status: 400 })
      }

      const origin = request.headers.get('origin') || request.headers.get('host') || 'localhost:3000'
      const protocol = origin.startsWith('http') ? '' : 'http://'
      const renderUrl = `${protocol}${origin}/api/templates/render`

      const template = String(templateName || (templateData as Record<string, string>).template || 'quote-card').replace(/_/g, '-')
      const res = await fetch(renderUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, data: templateData }),
      })

      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: `Template render failed: ${err}` }, { status: 500 })
      }

      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return NextResponse.json({ mediaUrls: [`data:image/png;base64,${base64}`] })
    }

    // Astria: kick off generation
    if (source === 'astria') {
      if (!prompt) {
        return NextResponse.json({ error: 'prompt required for astria source' }, { status: 400 })
      }

      const res = await fetch(`https://api.astria.ai/tunes/${TUNE_ID}/prompts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ASTRIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: { text: prompt, num_images: 4 } }),
      })

      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: `Astria error: ${err}` }, { status: res.status })
      }

      const data = await res.json()
      return NextResponse.json({ mediaUrls: [], jobId: data.id })
    }

    // Upload: pass through URLs
    if (source === 'upload') {
      if (!urls || urls.length === 0) {
        return NextResponse.json({ error: 'urls required for upload source' }, { status: 400 })
      }
      return NextResponse.json({ mediaUrls: urls })
    }

    return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
