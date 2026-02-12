import { NextResponse } from 'next/server'

const ASTRIA_API_KEY = process.env.REPLICATE_API_TOKEN || ''
const TUNE_ID = '4049178'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const promptId = searchParams.get('promptId')

  if (!promptId) {
    return NextResponse.json({ error: 'promptId is required' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.astria.ai/tunes/${TUNE_ID}/prompts/${promptId}`, {
      headers: {
        'Authorization': `Bearer ${ASTRIA_API_KEY}`,
      },
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Astria API error: ${err}` }, { status: res.status })
    }

    const data = await res.json()
    const images = data.images || []
    const done = images.length > 0

    return NextResponse.json({
      status: done ? 'completed' : 'processing',
      images,
      promptId,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
