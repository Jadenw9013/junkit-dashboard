/**
 * Daily Health Check Cron
 * Alerts owner if no new leads in 5+ days (potential form breakage).
 */
import { getLastLeadDate, saveAutomationLog } from '@/lib/db'
import { sendOwnerAlert } from '@/lib/sms'

export async function runHealthCheckCron() {
  console.log('[CRON] Running daily health check...')

  const lastLead = await getLastLeadDate()

  if (!lastLead) {
    console.log('[HEALTH] No leads ever — skipping')
    return { status: 'no_leads_ever' }
  }

  const daysSince = Math.floor(
    (Date.now() - lastLead.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSince >= 5) {
    const message =
      `Junk It AI: No new leads in ${daysSince} days. ` +
      `Your contact form may not be working. ` +
      `Check your dashboard for details.`

    await sendOwnerAlert(message)

    // Also email developer if configured
    const devEmail = process.env.SUPPORT_EMAIL
    if (devEmail && devEmail !== 'placeholder') {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Junk It Monitor <onboarding@resend.dev>',
          to: devEmail,
          subject: `[Junk It] No leads in ${daysSince} days`,
          text: `The Junk It contact form may be broken.\n\nLast lead: ${lastLead.toISOString()}\nDays since: ${daysSince}`,
        })
      } catch (err) {
        console.error('[HEALTH] Failed to email developer:', err)
      }
    }

    await saveAutomationLog({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      trigger: 'health_check',
      action: `alert_no_leads_${daysSince}_days`,
      success: true,
      fallbackUsed: false,
    })

    return { status: 'alert_sent', daysSince }
  }

  console.log(`[HEALTH] System healthy — last lead ${daysSince} days ago`)
  return { status: 'healthy', daysSince }
}
