import { NextResponse } from 'next/server'
import { scorePhotos } from '@/lib/companycam-scorer'

export async function GET() {
  try {
    const scored = await scorePhotos()
    return NextResponse.json({ photos: scored })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
