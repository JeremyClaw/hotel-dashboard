import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pass through login, API, and static files
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check session
  const session = request.cookies.get('hotel_session')?.value
  const secret = process.env.SESSION_SECRET

  if (!secret || !session || session !== secret) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon).*)'],
}
