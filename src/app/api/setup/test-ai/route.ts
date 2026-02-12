import { NextResponse } from 'next/server'
import { testAIConnection } from '@/lib/ai'
import type { AIConfig } from '@/types'

export async function POST(request: Request) {
  try {
    const config: AIConfig = await request.json()
    const success = await testAIConnection(config)
    return NextResponse.json({ success })
  } catch {
    return NextResponse.json({ success: false, error: 'Connection test failed' }, { status: 500 })
  }
}
