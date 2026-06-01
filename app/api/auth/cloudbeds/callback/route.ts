import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken } from '@/lib/cloudbeds'

/**
 * Cloudbeds OAuth callback
 * Cloudbeds redirects here after the hotel owner approves access.
 * We exchange the code for tokens and store them.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/settings?error=cloudbeds_denied`, req.url)
    )
  }

  try {
    const tokens = await exchangeCodeForToken(code)

    // Store tokens in cookies (simple approach for single-owner dashboard)
    // In production with multiple properties, store in Supabase
    const response = NextResponse.redirect(new URL('/settings?connected=true', req.url))

    response.cookies.set('cb_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expires_in || 3600,
      path: '/',
    })

    if (tokens.refresh_token) {
      response.cookies.set('cb_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    return response
  } catch (err) {
    console.error('Cloudbeds OAuth error:', err)
    return NextResponse.redirect(
      new URL('/settings?error=cloudbeds_failed', req.url)
    )
  }
}
