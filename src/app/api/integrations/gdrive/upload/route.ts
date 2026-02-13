import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/integrations/gdrive'

export async function POST(req: NextRequest) {
  const accessToken = req.headers.get('x-gdrive-token')
  if (!accessToken) return NextResponse.json({ error: 'Missing x-gdrive-token header' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folderId = formData.get('folderId') as string | null

    if (!file || !folderId) {
      return NextResponse.json({ error: 'file and folderId required' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const result = await uploadFile(accessToken, folderId, file.name, file.type, buffer)
    return NextResponse.json({ file: result })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 })
  }
}
