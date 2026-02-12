import { NextResponse } from 'next/server'

// Accounts are stored client-side in zustand/localStorage
// These endpoints exist for future Supabase sync

export async function GET() {
  return NextResponse.json({ message: 'Accounts are stored locally. Use Supabase sync for server-side storage.' })
}

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ success: true, account: body })
}

export async function PUT(request: Request) {
  const body = await request.json()
  return NextResponse.json({ success: true, account: body })
}
