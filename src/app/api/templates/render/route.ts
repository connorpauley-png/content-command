import { NextRequest } from 'next/server'
import { renderTemplate, TEMPLATES } from '@/lib/templates'
import { renderHtmlToPng } from '@/lib/playwright-renderer'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, width, height } = body
    const template = (body.template as string)?.replace(/_/g, '-')

    if (!template) {
      return Response.json(
        { error: 'Missing "template" field', available: Object.keys(TEMPLATES) },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object') {
      return Response.json(
        { error: 'Missing or invalid "data" field' },
        { status: 400 }
      )
    }

    if (!data.brandColors) {
      data.brandColors = { primary: '#254421', accent: '#e2b93b', background: '#0a0a0a', text: '#ffffff' }
    }

    const result = renderTemplate(template, data, { width, height })
    const png = await renderHtmlToPng(result.html, result.width, result.height)

    return new Response(png, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    })
  } catch (err: unknown) {
    return Response.json(
      { error: (err instanceof Error ? err.message : 'Internal server error') },
      { status: (err instanceof Error && err.message?.includes('Unknown template')) ? 400 : 500 }
    )
  }
}

export async function GET() {
  const list = Object.entries(TEMPLATES).map(([id, meta]) => ({
    id,
    name: meta.name,
    description: meta.description,
    requiredFields: meta.requiredFields,
    defaultWidth: meta.defaultWidth,
    defaultHeight: meta.defaultHeight,
  }))

  return Response.json({ templates: list })
}
