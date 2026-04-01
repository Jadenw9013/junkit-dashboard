import { getLastIncomingLeadDate } from '@/lib/jobs'
import Link from 'next/link'

export default async function WebhookStatus() {
  const lastLead = await getLastIncomingLeadDate()

  // No webhook jobs yet — don't alarm the owner
  if (!lastLead) return null

  const daysSince = Math.floor((Date.now() - new Date(lastLead).getTime()) / (1000 * 60 * 60 * 24))

  // Within 7 days — all good
  if (daysSince <= 7) return null

  const isStale = daysSince > 30
  const color = isStale ? '#ef4444' : '#d97706'
  const bgColor = isStale ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)'
  const borderColor = isStale ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'

  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}`, color }}>
      No new leads from your website in {daysSince} days. Is your contact form working?{' '}
      <Link href="/admin/webhook-setup" className="underline font-medium">Check webhook →</Link>
    </div>
  )
}
