import { NextRequest, NextResponse } from 'next/server'
import { createSession, deleteSession } from '@/lib/sessions'
import { checkLockout, recordFailedAttempt, recordSuccessfulLogin } from '@/lib/loginAttempts'

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  // Check lockout first
  const lockout = await checkLockout(ip)
  if (lockout.locked) {
    return NextResponse.json(
      { error: 'Too many attempts', minutesRemaining: lockout.minutesRemaining },
      { status: 429 }
    )
  }

  const body = await request.json()
  const { password } = body

  if (!password || password !== process.env.DASHBOARD_PASSWORD) {
    const { attempts } = await recordFailedAttempt(ip)
    const remaining = Math.max(0, 5 - attempts)
    return NextResponse.json({ success: false, attemptsRemaining: remaining }, { status: 401 })
  }

  await recordSuccessfulLogin(ip)
  const token = await createSession(ip)

  const response = NextResponse.json({ success: true })
  response.cookies.set('junk-it-session', token, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })

  return response
}

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('junk-it-session')?.value
  if (token) {
    await deleteSession(token)
  }
  const response = NextResponse.json({ success: true })
  response.cookies.set('junk-it-session', '', { maxAge: 0, path: '/' })
  return response
}
