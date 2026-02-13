import { NextResponse } from 'next/server'

// Posts are stored client-side in zustand/localStorage
// These endpoints exist for future Supabase sync

export async function GET() {
  return NextResponse.json({ message: 'Posts are stored locally. Use Supabase sync for server-side storage.' })
}

export async function POST(request: Request) {
  const body = await request.json()
  // Future: sync to Supabase
  return NextResponse.json({ success: true, post: body })
}

export async function PUT(request: Request) {
  const body = await request.json()
  return NextResponse.json({ success: true, post: body })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  return NextResponse.json({ success: true, deleted: id })
}
