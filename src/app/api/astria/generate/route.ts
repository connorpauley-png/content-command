import { NextResponse } from 'next/server'

const ASTRIA_API_KEY = process.env.REPLICATE_API_TOKEN || ''
const TUNE_ID = '4049178'

export async function POST(request: Request) {
  try {
    const { prompt, numImages = 4 } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const res = await fetch(`https://api.astria.ai/tunes/${TUNE_ID}/prompts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ASTRIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: {
          text: prompt,
          num_images: numImages,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Astria API error: ${err}` }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json({ promptId: data.id, status: 'processing' })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
