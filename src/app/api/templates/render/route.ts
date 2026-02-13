import { NextRequest } from 'next/server'
import { renderTemplate } from '@/lib/template-engine'
import { TEMPLATE_REGISTRY } from '@/lib/templates'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, width, height } = body
    const template = (body.template as string)?.replace(/_/g, '-')

    if (!template) {
      return Response.json(
        { error: 'Missing "template" field', available: Object.keys(TEMPLATE_REGISTRY) },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object') {
      return Response.json(
        { error: 'Missing or invalid "data" field' },
        { status: 400 }
      )
    }

    const png = await renderTemplate(template, data, { width, height })

    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (err: any) {
    console.error('Render error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({
    templates: Object.keys(TEMPLATE_REGISTRY),
    usage: 'POST { template, data, width?, height? }',
  })
}
