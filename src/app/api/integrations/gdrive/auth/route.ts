import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/integrations/gdrive'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gdrive/callback`

  if (!clientId) {
    return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 })
  }

  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
  ]

  const url = getAuthUrl(clientId, redirectUri, scopes)
  return NextResponse.json({ url })
}
