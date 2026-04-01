import { saveAutomationLog } from './db'

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
  fallbackUsed?: boolean
}

function isSMSConfigured(): boolean {
  const key = process.env.TELNYX_API_KEY
  return !!key && key !== 'placeholder'
}

/**
 * Send an SMS via Telnyx. Gracefully handles missing API key.
 */
export async function sendSMS(
  to: string,
  message: string,
  from?: string
): Promise<SMSResult> {
  const fromNumber = from ?? process.env.TELNYX_PHONE_NUMBER ?? '+10000000000'

  if (!isSMSConfigured()) {
    console.log(`[SMS DISABLED] Would send to ${to}: ${message}`)
    return { success: true, fallbackUsed: true }
  }

  try {
    const { Telnyx } = await import('telnyx')
    const telnyx = new Telnyx({ apiKey: process.env.TELNYX_API_KEY! })

    const result = await telnyx.messages.send({
      from: fromNumber,
      to,
      text: message,
    })

    const messageId = (result as Record<string, unknown>)?.id as string | undefined
    return { success: true, messageId }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error(`[SMS ERROR] Failed to send to ${to}:`, error)
    return { success: false, error }
  }
}

/**
 * Send an alert SMS to the business owner.
 */
export async function sendOwnerAlert(message: string): Promise<SMSResult> {
  const ownerPhone = process.env.OWNER_PHONE_NUMBER
  if (!ownerPhone || ownerPhone === '+14251234567') {
    console.log(`[SMS DISABLED] Owner alert: ${message}`)
    return { success: true, fallbackUsed: true }
  }
  return sendSMS(ownerPhone, message)
}

/**
 * Notify owner of an automation action and log it.
 */
export async function notifyOwnerOfAutomation(
  action: string,
  details: string
): Promise<void> {
  try {
    const formatted = `Junk It AI: ${action}\n${details}`
    await sendOwnerAlert(formatted)
    await saveAutomationLog({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      trigger: 'automation_notify',
      action,
      success: true,
      fallbackUsed: !isSMSConfigured(),
    })
  } catch (err) {
    console.error('[SMS] notifyOwnerOfAutomation failed:', err)
    // Never throw
  }
}
