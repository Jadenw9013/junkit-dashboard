'use server'

import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic'
import { addJob } from '@/lib/jobs'
import { ServiceType, Customer } from '@/lib/types'
import { readSettings, buildBusinessContext } from '@/lib/settings'
import { logAction } from '@/lib/audit'
import { getFallback } from '@/lib/fallbacks'
import { findCustomerByPhone } from '@/lib/customers'
import { sanitizeText, sanitizePhone } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/rateLimiter'

const TIMEOUT_MS = 15000

function extractPhone(text: string): string | null {
  const match = text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)
  return match ? match[0] : null
}

export async function draftLeadResponse(
  inquiry: string
): Promise<{ sms: string; email: string; usedFallback?: boolean; returningCustomer?: Customer | null; error?: string }> {
  const rl = checkRateLimit('lead')
  if (!rl.allowed) {
    return { sms: '', email: '', error: 'rate_limited' }
  }

  const cleanInquiry = sanitizeText(inquiry, 2000)
  const settings = await readSettings()
  const context = buildBusinessContext(settings)
  const start = Date.now()

  let returningCustomer: Customer | null = null
  const phone = extractPhone(cleanInquiry)
  if (phone) {
    returningCustomer = await findCustomerByPhone(sanitizePhone(phone))
  }

  let systemPrompt = `${context}

You are a response assistant for ${settings.businessName}. Given a customer inquiry, produce TWO responses:
1. SMS (under 160 characters): ${settings.tone}, direct, includes price range if appropriate, signs off as '${settings.businessName}'
2. EMAIL (3-4 short paragraphs): professional but warm, confirms service area, gives price range if appropriate, explains next step is a quick call to confirm details, never promises same-day without owner confirmation

Format your response as JSON:
{ "sms": "...", "email": "..." }`

  if (returningCustomer) {
    systemPrompt += `\n\nRETURNING CUSTOMER CONTEXT: This appears to be a returning customer. Name: ${returningCustomer.name}, Previous jobs: ${returningCustomer.totalJobs}, Last service: ${returningCustomer.lastJobService} in ${returningCustomer.lastJobDate}. Reference their history warmly in the response if appropriate.`
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Claude API timeout')), TIMEOUT_MS)
    )

    const message = await Promise.race([
      anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: cleanInquiry }],
      }),
      timeoutPromise,
    ])

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Failed to parse AI response')

    const parsed = JSON.parse(jsonMatch[0])
    const result = { sms: parsed.sms ?? '', email: parsed.email ?? '' }

    await logAction({
      action: 'draftLeadResponse',
      tool: 'lead',
      inputSummary: cleanInquiry.slice(0, 100),
      outputSummary: result.sms.slice(0, 100),
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      durationMs: Date.now() - start,
      success: true,
    })

    return { ...result, returningCustomer }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('[lead] draftLeadResponse failed:', error)
    await logAction({
      action: 'draftLeadResponse',
      tool: 'lead',
      inputSummary: cleanInquiry.slice(0, 100),
      outputSummary: '',
      durationMs: Date.now() - start,
      success: false,
      error,
    })
    return { ...getFallback('lead'), usedFallback: true, returningCustomer: null }
  }
}

export async function saveLeadJob(data: {
  customerName: string
  phone: string
  city: string
  service: ServiceType
  aiDraftSMS: string
  aiDraftEmail: string
}) {
  const job = await addJob({
    customerName: sanitizeText(data.customerName, 100),
    phone: sanitizePhone(data.phone),
    city: sanitizeText(data.city, 100),
    service: data.service,
    status: 'lead',
    aiDraftSMS: data.aiDraftSMS,
    aiDraftEmail: data.aiDraftEmail,
  })
  return job
}
