import { NextRequest, NextResponse } from 'next/server'
import { listFiles } from '@/lib/integrations/gdrive'

export async function GET(req: NextRequest) {
  const accessToken = req.headers.get('x-gdrive-token')
  const folderId = req.nextUrl.searchParams.get('folderId')
  const mimeType = req.nextUrl.searchParams.get('mimeType') ?? undefined

  if (!accessToken) return NextResponse.json({ error: 'Missing x-gdrive-token header' }, { status: 401 })
  if (!folderId) return NextResponse.json({ error: 'folderId required' }, { status: 400 })

  try {
    const files = await listFiles(accessToken, folderId, mimeType)
    return NextResponse.json({ files })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 })
  }
}
