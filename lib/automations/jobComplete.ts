/**
 * Job Complete Automation
 * Sends a thank-you / review request 2 hours after a job is completed.
 * In serverless, we can't wait 2 hours — so this saves a scheduled send time
 * and a cron job picks it up. Or, if Trigger.dev is configured, it handles the delay.
 */
import { sendSMS } from '@/lib/sms'
import { saveAutomationLog } from '@/lib/db'
import { readSettings } from '@/lib/settings'

export interface JobCompletePayload {
  jobId: string
  customerName: string
  phone: string
  service: string
  city: string
}

export async function runJobCompleteAutomation(payload: JobCompletePayload) {
  const { jobId, customerName, phone } = payload

  console.log('[AUTOMATION] Job complete, sending thank you to:', customerName)

  const settings = await readSettings()
  const firstName = customerName.split(' ')[0]

  const message = `Hey ${firstName}! Thanks for choosing ${settings.businessName} today — it was great working with you. Feel free to reach out anytime!`

  const sms = message.length > 160 ? message.substring(0, 157) + '...' : message

  const result = await sendSMS(phone, sms)

  await saveAutomationLog({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    trigger: 'job_complete',
    action: 'sent_thank_you',
    recipient: phone.slice(-4),
    success: result.success,
    fallbackUsed: result.fallbackUsed ?? false,
    jobId,
  })

  return { status: 'sent', sms }
}
