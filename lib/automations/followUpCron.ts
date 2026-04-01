/**
 * Weekly Follow-Up Cron
 * Generates follow-up messages for stale leads and queues for owner approval.
 */
import { getUnconvertedLeads, saveAutomationLog } from '@/lib/db'
import { generateFollowUpMessage } from '@/lib/ai'
import { sendOwnerAlert } from '@/lib/sms'
import { storageSet, KEYS } from '@/lib/storage'

export async function runFollowUpCron() {
  console.log('[CRON] Running weekly follow-up check...')

  const staleLeads = await getUnconvertedLeads(7)

  if (staleLeads.length === 0) {
    console.log('[CRON] No stale leads found')
    return { status: 'no_stale_leads', count: 0 }
  }

  const batch: Array<{
    jobId: string
    customerName: string
    phone: string
    city: string
    sms: string
    daysSince: number
    sent?: boolean
    skipped?: boolean
  }> = []

  for (const lead of staleLeads) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    const result = await generateFollowUpMessage({
      customerName: lead.customerName,
      city: lead.city ?? '',
      service: lead.service,
      daysSince,
    })

    if (result.shouldSend) {
      batch.push({
        jobId: lead.id,
        customerName: lead.customerName,
        phone: lead.phone,
        city: lead.city ?? '',
        sms: result.sms,
        daysSince,
      })
    }
  }

  if (batch.length === 0) {
    console.log('[CRON] AI decided none worth sending')
    return { status: 'ai_decided_none_worth_sending', count: 0 }
  }

  // Save batch for owner approval
  await storageSet(KEYS.PENDING_FOLLOWUPS, {
    generatedAt: new Date().toISOString(),
    items: batch,
  })

  // Notify owner
  await sendOwnerAlert(
    `Junk It AI: ${batch.length} follow-up messages ready for your review. Open the dashboard to approve and send.`
  )

  await saveAutomationLog({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    trigger: 'follow_up_cron',
    action: `generated_${batch.length}_followups_for_approval`,
    success: true,
    fallbackUsed: false,
  })

  return { status: 'batch_ready', count: batch.length }
}
