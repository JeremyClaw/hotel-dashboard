import { NextResponse } from 'next/server'

// OAuth flow replaced by API key authentication.
export async function GET() {
  return NextResponse.redirect(new URL('/settings', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}
