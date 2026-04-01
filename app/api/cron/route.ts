import { NextRequest, NextResponse } from 'next/server'
import { runFollowUpCron } from '@/lib/automations/followUpCron'
import { runReengagementCron } from '@/lib/automations/reengagementCron'
import { runMonthlyReportCron } from '@/lib/automations/monthlyReport'
import { runHealthCheckCron } from '@/lib/automations/healthCheck'

/**
 * Cron endpoint — called by Vercel Cron or Trigger.dev schedules.
 * Protected by CRON_SECRET or WEBHOOK_SECRET.
 * 
 * Usage:
 *   GET /api/cron?job=follow-up
 *   GET /api/cron?job=reengagement
 *   GET /api/cron?job=monthly-report
 *   GET /api/cron?job=health-check
 */
export async function GET(request: NextRequest) {
  // Verify cron authorization
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET ?? process.env.WEBHOOK_SECRET
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const job = request.nextUrl.searchParams.get('job')

  try {
    let result: unknown

    switch (job) {
      case 'follow-up':
        result = await runFollowUpCron()
        break
      case 'reengagement':
        result = await runReengagementCron()
        break
      case 'monthly-report':
        result = await runMonthlyReportCron()
        break
      case 'health-check':
        result = await runHealthCheckCron()
        break
      default:
        return NextResponse.json({ error: `Unknown job: ${job}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, job, result })
  } catch (err) {
    console.error(`[CRON] Job ${job} failed:`, err)
    return NextResponse.json(
      { success: false, job, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
