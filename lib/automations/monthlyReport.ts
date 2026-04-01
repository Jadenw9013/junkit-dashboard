/**
 * Monthly Report Cron
 * Generates and emails a monthly business report to the owner.
 */
import { generateMonthlyReport } from '@/lib/reports'
import { generateMonthlyReportEmail } from '@/lib/ai'
import { saveAutomationLog } from '@/lib/db'

export async function runMonthlyReportCron() {
  console.log('[CRON] Generating monthly report...')

  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const report = await generateMonthlyReport(
    lastMonth.getFullYear(),
    lastMonth.getMonth() + 1
  )

  const emailContent = await generateMonthlyReportEmail(report)

  const ownerEmail = process.env.RECOVERY_EMAIL
  if (!ownerEmail || ownerEmail === 'placeholder') {
    console.log('[REPORT] No owner email set, skipping send')
    return { status: 'skipped_no_email' }
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    await resend.emails.send({
      from: 'Junk It Dashboard <onboarding@resend.dev>',
      to: ownerEmail,
      subject: emailContent.subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1C2B3A">${report.month} Report</h2>
          <p style="font-size:16px;line-height:1.6;color:#333">${emailContent.summary}</p>
          <h3 style="color:#1C2B3A">Highlights</h3>
          <ul>${emailContent.highlights.map(h => `<li style="margin-bottom:8px">${h}</li>`).join('')}</ul>
          <div style="background:#FFFBEA;padding:16px;border-radius:8px;margin-top:24px;border-left:4px solid #F5C518">
            <strong>Suggestion for next month:</strong><br>${emailContent.suggestion}
          </div>
          <hr style="margin:32px 0;border:1px solid #eee">
          <p style="font-size:12px;color:#999">
            Jobs: ${report.summary.totalJobs} · Revenue: $${report.summary.totalRevenue} · Avg: $${Math.round(report.summary.avgJobValue)}
          </p>
        </div>
      `,
    })

    await saveAutomationLog({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      trigger: 'report_cron',
      action: `sent_monthly_report_${report.month}`,
      recipient: ownerEmail.slice(-10),
      success: true,
      fallbackUsed: false,
    })

    return { status: 'sent', month: report.month, totalRevenue: report.summary.totalRevenue }
  } catch (err) {
    console.error('[REPORT] Failed to send:', err)
    return { status: 'failed', error: err instanceof Error ? err.message : String(err) }
  }
}
