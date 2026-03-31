'use server'

import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic'
import { addJob } from '@/lib/jobs'
import { ServiceType } from '@/lib/types'
import { readSettings, buildBusinessContext } from '@/lib/settings'
import { logAction } from '@/lib/audit'
import { getFallback } from '@/lib/fallbacks'

export async function draftLeadResponse(
  inquiry: string
): Promise<{ sms: string; email: string; usedFallback?: boolean }> {
  const settings = await readSettings()
  const context = buildBusinessContext(settings)
  const start = Date.now()

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: `${context}

You are a response assistant for ${settings.businessName}. Given a customer inquiry, produce TWO responses:
1. SMS (under 160 characters): ${settings.tone}, direct, includes price range if appropriate, signs off as '${settings.businessName}'
2. EMAIL (3-4 short paragraphs): professional but warm, confirms service area, gives price range if appropriate, explains next step is a quick call to confirm details, never promises same-day without owner confirmation

Format your response as JSON:
{ "sms": "...", "email": "..." }`,
      messages: [{ role: 'user', content: inquiry }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Failed to parse AI response')

    const parsed = JSON.parse(jsonMatch[0])
    const result = { sms: parsed.sms ?? '', email: parsed.email ?? '' }

    await logAction({
      action: 'draftLeadResponse',
      tool: 'lead',
      inputSummary: inquiry.slice(0, 100),
      outputSummary: result.sms.slice(0, 100),
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      durationMs: Date.now() - start,
      success: true,
    })

    return result
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('[lead] draftLeadResponse failed:', error)
    await logAction({
      action: 'draftLeadResponse',
      tool: 'lead',
      inputSummary: inquiry.slice(0, 100),
      outputSummary: '',
      durationMs: Date.now() - start,
      success: false,
      error,
    })
    return { ...getFallback('lead'), usedFallback: true }
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
    customerName: data.customerName,
    phone: data.phone,
    city: data.city,
    service: data.service,
    status: 'lead',
    aiDraftSMS: data.aiDraftSMS,
    aiDraftEmail: data.aiDraftEmail,
  })
  return job
}
