import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/telegram']

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Always allow public paths through
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      return NextResponse.next()
    }

    // Allow static files
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon') ||
      pathname.includes('.')
    ) {
      return NextResponse.next()
    }

    const session = request.cookies.get('hotel_session')?.value
    const secret = process.env.SESSION_SECRET

    // If SESSION_SECRET isn't configured, redirect to login
    if (!secret) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!session || session !== secret) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  } catch {
    // On any unexpected error, redirect to login rather than 500
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
