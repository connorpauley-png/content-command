// Vision API - analyze images with OpenAI gpt-4o-mini
import { NextRequest, NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

export async function POST(request: NextRequest) {
  const { imageUrl, prompt } = await request.json()

  if (!imageUrl || !prompt) {
    return NextResponse.json({ error: 'imageUrl and prompt required' }, { status: 400 })
  }

  if (!OPENAI_API_KEY) {
    // Fallback when no key configured
    return NextResponse.json({
      analysis: JSON.stringify({
        scene: 'Job site photo',
        quality: 7,
        postType: 'transformation',
        platforms: ['instagram', 'facebook'],
        caption: 'Another property looking fresh. This is what we do every day across Monroe. Call or text (318) 600-9123 if your yard needs some attention.',
        hashtags: ['MonroeLA', 'LawnCare', 'Landscaping', 'CollegeBros'],
      }),
    })
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('OpenAI Vision API error:', err)
      return NextResponse.json({ error: 'Vision API failed' }, { status: 500 })
    }

    const data = await res.json()
    const analysis = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({ analysis })
  } catch (e) {
    console.error('Vision error:', e)
    return NextResponse.json({ error: 'Vision analysis failed' }, { status: 500 })
  }
}
