import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { slides, template, brandColors } = await request.json()

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: 'slides array is required' }, { status: 400 })
    }

    const templateName = template || 'quote-card'
    const renderedUrls: string[] = []

    for (const slide of slides) {
      const data: Record<string, unknown> = {
        headline: slide.headline || '',
        quote: slide.headline || slide.body || '',
        subtext: slide.body || '',
        slideNumber: slide.slideNumber,
        ...(brandColors && { brandColors }),
      }

      const origin = request.headers.get('origin') || request.headers.get('host') || 'localhost:3000'
      const protocol = origin.startsWith('http') ? '' : 'http://'
      const renderUrl = `${protocol}${origin}/api/templates/render`

      const res = await fetch(renderUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: templateName, data }),
      })

      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json(
          { error: `Template render failed for slide ${slide.slideNumber}: ${err}` },
          { status: 500 }
        )
      }

      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      renderedUrls.push(`data:image/png;base64,${base64}`)
    }

    return NextResponse.json({ mediaUrls: renderedUrls })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
