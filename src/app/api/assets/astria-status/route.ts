import { NextResponse } from 'next/server'

const ASTRIA_API_KEY = process.env.ASTRIA_API_KEY || ''
const TUNE_ID = '4049178'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId query param is required' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.astria.ai/tunes/${TUNE_ID}/prompts/${jobId}`, {
      headers: { Authorization: `Bearer ${ASTRIA_API_KEY}` },
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `Astria API error: ${err}` }, { status: res.status })
    }

    const data = await res.json()
    const images = data.images as string[] | undefined

    if (images && images.length > 0) {
      return NextResponse.json({ status: 'ready', images })
    }

    if (data.status === 'failed' || data.error) {
      return NextResponse.json({ status: 'failed', error: data.error || 'Generation failed' })
    }

    return NextResponse.json({ status: 'generating' })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
