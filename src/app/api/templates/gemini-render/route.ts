import { NextRequest } from 'next/server'
import { generateGeminiGraphic } from '@/lib/gemini-renderer'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const template = (body.template as string)?.replace(/_/g, '-')
    const { data, brandColors } = body

    if (!template) {
      return Response.json({ error: 'Missing "template" field' }, { status: 400 })
    }
    if (!data || typeof data !== 'object') {
      return Response.json({ error: 'Missing or invalid "data" field' }, { status: 400 })
    }

    const png = await generateGeminiGraphic(template, data, brandColors)

    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'X-Renderer': 'gemini-2.0-flash',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = message.includes('Unknown template') ? 400 : 500
    return Response.json({ error: message }, { status })
  }
}
