/**
 * Monthly Re-engagement Cron
 * Generates re-engagement messages for dormant customers.
 */
import { getDormantCustomers, saveAutomationLog } from '@/lib/db'
import { generateReengagementMessage } from '@/lib/ai'
import { sendOwnerAlert } from '@/lib/sms'
import { storageSet, KEYS } from '@/lib/storage'

export async function runReengagementCron() {
  console.log('[CRON] Running monthly re-engagement check...')

  const dormant = await getDormantCustomers(6)

  if (dormant.length === 0) {
    console.log('[CRON] No dormant customers found')
    return { status: 'no_dormant_customers', count: 0 }
  }

  const batch: Array<{
    customerId: string
    customerName: string
    phone: string
    city: string
    sms: string
    monthsSince: number
    sent?: boolean
    skipped?: boolean
  }> = []

  for (const customer of dormant) {
    const monthsSince = Math.floor(
      (Date.now() - new Date(customer.lastJobDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    const result = await generateReengagementMessage({
      customerName: customer.name,
      lastService: customer.lastJobService ?? 'junk removal',
      monthsSince,
      city: customer.city,
    })

    batch.push({
      customerId: customer.id,
      customerName: customer.name,
      phone: customer.phone,
      city: customer.city,
      sms: result.sms,
      monthsSince,
    })
  }

  // Save for approval
  await storageSet(KEYS.PENDING_REENGAGEMENTS, {
    generatedAt: new Date().toISOString(),
    items: batch,
  })

  // Notify owner
  await sendOwnerAlert(
    `Junk It AI: ${batch.length} re-engagement messages ready. Open the dashboard to review and send.`
  )

  await saveAutomationLog({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    trigger: 'reengagement_cron',
    action: `generated_${batch.length}_reengagements_for_approval`,
    success: true,
    fallbackUsed: false,
  })

  return { status: 'batch_ready', count: batch.length }
}
