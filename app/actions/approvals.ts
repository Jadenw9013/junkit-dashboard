'use server'

import { sendSMS } from '@/lib/sms'
import { saveAutomationLog } from '@/lib/db'
import { storageGet, storageSet, KEYS } from '@/lib/storage'

interface PendingBatch {
  generatedAt: string
  items: Array<{
    jobId?: string
    customerId?: string
    customerName: string
    phone: string
    city: string
    sms: string
    daysSince?: number
    monthsSince?: number
    sent?: boolean
    skipped?: boolean
    sentAt?: string
  }>
}

export async function sendApprovalItem(
  type: 'followup' | 'reengagement',
  index: number
): Promise<{ success: boolean; error?: string }> {
  const key = type === 'followup' ? KEYS.PENDING_FOLLOWUPS : KEYS.PENDING_REENGAGEMENTS
  const batch = await storageGet<PendingBatch | null>(key, null)
  if (!batch || !batch.items[index]) {
    return { success: false, error: 'Item not found' }
  }

  const item = batch.items[index]
  if (item.sent || item.skipped) {
    return { success: false, error: 'Item already processed' }
  }

  const result = await sendSMS(item.phone, item.sms)

  batch.items[index] = {
    ...item,
    sent: result.success,
    sentAt: new Date().toISOString(),
  }
  await storageSet(key, batch)

  await saveAutomationLog({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    trigger: type === 'followup' ? 'follow_up_cron' : 'reengagement_cron',
    action: `approved_and_sent_to_${item.customerName}`,
    recipient: item.phone.slice(-4),
    success: result.success,
    fallbackUsed: result.fallbackUsed ?? false,
    jobId: item.jobId,
    customerId: item.customerId,
  })

  return { success: result.success, error: result.error }
}

export async function skipApprovalItem(
  type: 'followup' | 'reengagement',
  index: number
): Promise<{ success: boolean }> {
  const key = type === 'followup' ? KEYS.PENDING_FOLLOWUPS : KEYS.PENDING_REENGAGEMENTS
  const batch = await storageGet<PendingBatch | null>(key, null)
  if (!batch || !batch.items[index]) {
    return { success: false }
  }

  batch.items[index] = { ...batch.items[index], skipped: true }
  await storageSet(key, batch)
  return { success: true }
}

export async function sendAllApprovals(
  type: 'followup' | 'reengagement'
): Promise<{ sent: number; failed: number }> {
  const key = type === 'followup' ? KEYS.PENDING_FOLLOWUPS : KEYS.PENDING_REENGAGEMENTS
  const batch = await storageGet<PendingBatch | null>(key, null)
  if (!batch) return { sent: 0, failed: 0 }

  let sent = 0
  let failed = 0

  for (let i = 0; i < batch.items.length; i++) {
    const item = batch.items[i]
    if (item.sent || item.skipped) continue

    const result = await sendSMS(item.phone, item.sms)
    batch.items[i] = {
      ...item,
      sent: result.success,
      sentAt: new Date().toISOString(),
    }

    if (result.success) sent++
    else failed++
  }

  await storageSet(key, batch)
  return { sent, failed }
}

export async function clearApprovals(
  type: 'followup' | 'reengagement'
): Promise<{ success: boolean }> {
  const key = type === 'followup' ? KEYS.PENDING_FOLLOWUPS : KEYS.PENDING_REENGAGEMENTS
  await storageSet(key, null)
  return { success: true }
}

export async function getPendingApprovals(): Promise<{
  followups: PendingBatch | null
  reengagements: PendingBatch | null
}> {
  const followups = await storageGet<PendingBatch | null>(KEYS.PENDING_FOLLOWUPS, null)
  const reengagements = await storageGet<PendingBatch | null>(KEYS.PENDING_REENGAGEMENTS, null)
  return { followups, reengagements }
}
