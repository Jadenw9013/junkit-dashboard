/**
 * New Lead Automation
 * Fires when a webhook lead comes in. Sends acknowledgment + AI quote via SMS.
 */
import { generateLeadResponse, generateAcknowledgmentSMS } from '@/lib/ai'
import { sendSMS, notifyOwnerOfAutomation } from '@/lib/sms'
import { saveAutomationLog } from '@/lib/db'

export interface NewLeadPayload {
  jobId: string
  customerName: string
  phone: string
  service: string
  city: string
  description: string
}

export async function runNewLeadAutomation(payload: NewLeadPayload) {
  const { jobId, customerName, phone, service, city, description } = payload

  console.log('[AUTOMATION] Processing new lead:', customerName, city)

  // Step 1: Send immediate acknowledgment
  try {
    const ack = await generateAcknowledgmentSMS({ customerName, service })
    await sendSMS(phone, ack.sms)
    console.log('[AUTOMATION] Acknowledgment sent:', ack.sms)
  } catch (err) {
    console.error('[AUTOMATION] Acknowledgment failed:', err)
  }

  // Step 2: Generate full AI response
  const response = await generateLeadResponse({
    inquiry: description,
    customerName,
  })

  // Step 3: If AI needs clarification, send question instead
  if (response.needsMoreInfo && response.clarifyingQuestion) {
    await sendSMS(phone, response.clarifyingQuestion)
    await notifyOwnerOfAutomation(
      'Clarification requested',
      `Asked ${customerName}: "${response.clarifyingQuestion}"`
    )
    await saveAutomationLog({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      trigger: 'new_lead',
      action: 'sent_clarifying_question',
      recipient: phone.slice(-4),
      success: true,
      fallbackUsed: !!response.usedFallback,
      jobId,
    })
    return { status: 'clarification_requested' }
  }

  // Step 4: Send the quote
  const smsSent = await sendSMS(phone, response.sms)

  // Step 5: Notify owner
  await notifyOwnerOfAutomation(
    `Auto-quoted ${customerName} in ${city}`,
    `Sent: "${response.sms}"\nEstimate: $${response.estimatedPriceMin}–$${response.estimatedPriceMax}`
  )

  // Step 6: Log it
  await saveAutomationLog({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    trigger: 'new_lead',
    action: 'auto_quoted',
    recipient: phone.slice(-4),
    success: smsSent.success,
    fallbackUsed: smsSent.fallbackUsed ?? !!response.usedFallback,
    jobId,
  })

  return {
    status: 'quoted',
    smsSent: response.sms,
    estimate: `$${response.estimatedPriceMin}–$${response.estimatedPriceMax}`,
  }
}
