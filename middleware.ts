import { NextRequest, NextResponse } from 'next/server'
import { validateSessionEdge } from '@/lib/sessions-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (
    pathname === '/login' ||
    pathname === '/api/webhook' ||
    pathname === '/api/auth' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('junk-it-session')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const valid = await validateSessionEdge(token)
  if (!valid) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.set('junk-it-session', '', { maxAge: 0, path: '/' })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
