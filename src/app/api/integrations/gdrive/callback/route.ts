import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/integrations/gdrive'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL(`/settings?gdrive_error=${error}`, req.url))
  }
  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gdrive/callback`

  try {
    const tokens = await exchangeCode(code, clientId, clientSecret, redirectUri)

    // Return tokens to the client — the app stores them in its config/store
    // In production you'd set an httpOnly cookie or store server-side
    const params = new URLSearchParams({
      gdrive_connected: 'true',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    })
    return NextResponse.redirect(new URL(`/settings?${params}`, req.url))
  } catch (err: unknown) {
    return NextResponse.redirect(new URL(`/settings?gdrive_error=${encodeURIComponent(err instanceof Error ? (err instanceof Error ? err.message : 'Unknown error') : 'Unknown error')}`, req.url))
  }
}
