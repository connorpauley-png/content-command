import { NextRequest, NextResponse } from 'next/server'
import { listFiles, setupClientFolderStructure } from '@/lib/integrations/gdrive'

export async function POST(req: NextRequest) {
  const accessToken = req.headers.get('x-gdrive-token')
  if (!accessToken) return NextResponse.json({ error: 'Missing x-gdrive-token header' }, { status: 401 })

  try {
    const body = await req.json()
    const { action, folderId, clientName } = body as {
      action: 'sync' | 'setup'
      folderId?: string
      clientName?: string
    }

    // Setup: create the folder structure for a new client
    if (action === 'setup') {
      if (!clientName) return NextResponse.json({ error: 'clientName required for setup' }, { status: 400 })
      const structure = await setupClientFolderStructure(accessToken, clientName)
      return NextResponse.json({ structure })
    }

    // Sync: pull file list from a Drive folder as content assets
    if (action === 'sync') {
      if (!folderId) return NextResponse.json({ error: 'folderId required for sync' }, { status: 400 })

      const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      const allFiles = await listFiles(accessToken, folderId)
      const assets = allFiles.filter(f => IMAGE_TYPES.includes(f.mimeType)).map(f => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        thumbnailUrl: f.thumbnailLink,
        webUrl: f.webViewLink,
        modifiedAt: f.modifiedTime,
      }))

      return NextResponse.json({ assets, total: assets.length })
    }

    return NextResponse.json({ error: 'Invalid action. Use "sync" or "setup".' }, { status: 400 })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : 'Unknown error') }, { status: 500 })
  }
}
