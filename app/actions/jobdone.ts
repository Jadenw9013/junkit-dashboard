'use server'

import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic'
import { addJob, updateJob } from '@/lib/jobs'
import { Job, ServiceType } from '@/lib/types'
import { readSettings, buildBusinessContext } from '@/lib/settings'
import { logAction } from '@/lib/audit'
import { getFallback } from '@/lib/fallbacks'
import { upsertCustomer } from '@/lib/customers'
import { sanitizeName, sanitizePhone, sanitizeText, sanitizePrice } from '@/lib/sanitize'
import { checkRateLimit } from '@/lib/rateLimiter'

const TIMEOUT_MS = 15000

export interface JobDoneInput {
  customerName: string
  phone: string
  city: string
  service: ServiceType
  price: number
  notes?: string
}

export async function logJobAndGetReview(
  input: JobDoneInput
): Promise<{ job: Job; reviewSMS: string; usedFallback?: boolean; isNewCustomer?: boolean; error?: string }> {
  const rl = checkRateLimit('jobdone')
  if (!rl.allowed) {
    return { job: {} as Job, reviewSMS: '', error: 'rate_limited' }
  }

  const cleanInput: JobDoneInput = {
    customerName: sanitizeName(input.customerName),
    phone: sanitizePhone(input.phone),
    city: sanitizeName(input.city),
    service: input.service,
    price: sanitizePrice(input.price) ?? 0,
    notes: input.notes ? sanitizeText(input.notes, 2000) : undefined,
  }

  const settings = await readSettings()
  const context = buildBusinessContext(settings)
  const firstName = cleanInput.customerName.split(' ')[0]
  const serviceLabel =
    cleanInput.service === 'junk-removal'
      ? 'junk removal'
      : cleanInput.service === 'demolition'
      ? 'demolition'
      : cleanInput.service === 'trailer-rental'
      ? 'trailer rental'
      : 'job'

  const reviewLink = settings.googleReviewLink || '[GOOGLE REVIEW LINK]'
  const start = Date.now()
  let reviewSMS = ''
  let usedFallback = false

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Claude API timeout')), TIMEOUT_MS)
    )

    const message = await Promise.race([
      anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: `${context}

Write a review request SMS for ${settings.businessName}, a local junk removal business.
Use the customer's first name. Reference the specific service.
Be warm and genuine — sound like a real person, not a template.
Keep it under 160 characters.
End with this exact link: ${reviewLink}

Example tone:
'Hey Mike, thanks for having us out today for the garage cleanout! If you have a sec, a Google review would mean the world to us: ${reviewLink}'`,
        messages: [
          {
            role: 'user',
            content: `Customer first name: ${firstName}\nService performed: ${serviceLabel}`,
          },
        ],
      }),
      timeoutPromise,
    ])

    reviewSMS = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    await logAction({
      action: 'logJobAndGetReview',
      tool: 'jobdone',
      inputSummary: `${firstName} - ${serviceLabel}`,
      outputSummary: reviewSMS.slice(0, 100),
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      durationMs: Date.now() - start,
      success: true,
    })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('[jobdone] logJobAndGetReview failed:', error)
    await logAction({
      action: 'logJobAndGetReview',
      tool: 'jobdone',
      inputSummary: `${firstName} - ${serviceLabel}`,
      outputSummary: '',
      durationMs: Date.now() - start,
      success: false,
      error,
    })
    reviewSMS = getFallback('reviewSMS').replace('[GOOGLE REVIEW LINK]', reviewLink)
    usedFallback = true
  }

  const job = await addJob({
    customerName: cleanInput.customerName,
    phone: cleanInput.phone,
    city: cleanInput.city,
    service: cleanInput.service,
    price: cleanInput.price,
    notes: cleanInput.notes,
    status: 'completed',
    reviewRequestSMS: reviewSMS,
  })

  const { isNew: isNewCustomer } = await upsertCustomer({
    name: cleanInput.customerName,
    phone: cleanInput.phone,
    city: cleanInput.city,
    service: cleanInput.service,
    price: cleanInput.price,
    jobId: job.id,
  })

  return { job, reviewSMS, usedFallback, isNewCustomer }
}

export async function markJobReviewed(jobId: string) {
  return updateJob(jobId, { status: 'reviewed' })
}
