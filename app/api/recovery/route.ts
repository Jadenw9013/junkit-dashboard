import { NextRequest, NextResponse } from 'next/server'
import { generateRecoveryCode, validateRecoveryCode, setPasswordOverride } from '@/lib/recovery'

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  if (action === 'request') {
    const body = await request.json()
    const { email } = body

    // Always return success to not reveal if email is correct
    if (email !== process.env.RECOVERY_EMAIL) {
      return NextResponse.json({ success: true })
    }

    const code = await generateRecoveryCode()

    // Try sending email via Resend if API key is set
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Junk It Dashboard <onboarding@resend.dev>',
          to: process.env.RECOVERY_EMAIL!,
          subject: 'Junk It Dashboard — Your recovery code',
          text: `Your recovery code is: ${code}\n\nExpires in 15 minutes.`,
        })
      } catch (err) {
        console.error('[recovery] Failed to send email:', err)
      }
    }

    // Dev mode fallback: return code in response
    if (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: true, devCode: code })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'verify') {
    const body = await request.json()
    const { code, newPassword } = body

    if (!code || !newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const valid = await validateRecoveryCode(code)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
    }

    await setPasswordOverride(newPassword)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
