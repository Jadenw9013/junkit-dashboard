import { NextRequest, NextResponse } from 'next/server'
import { validateSessionEdge } from '@/lib/sessions-edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (
    pathname === '/login' ||
    pathname === '/api/webhook' ||
    pathname === '/api/auth' ||
    pathname === '/api/init' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Admin routes — check admin cookie
  if (pathname.startsWith('/admin')) {
    // Allow admin login page and admin auth API
    if (pathname === '/admin/login' || pathname === '/api/admin-auth') {
      return NextResponse.next()
    }
    const adminToken = request.cookies.get('junk-it-admin')?.value
    const secret = process.env.DEVELOPER_SECRET
    if (!secret || !adminToken || adminToken !== secret) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // Admin API routes
  if (pathname.startsWith('/api/admin')) {
    if (pathname === '/api/admin-auth') {
      return NextResponse.next()
    }
    const adminToken = request.cookies.get('junk-it-admin')?.value
    const secret = process.env.DEVELOPER_SECRET
    if (!secret || !adminToken || adminToken !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // All other routes — check owner session
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
