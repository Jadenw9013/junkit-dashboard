'use server'

import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic'
import { readSettings, buildBusinessContext } from '@/lib/settings'
import { logAction } from '@/lib/audit'
import { getFallback } from '@/lib/fallbacks'

export interface ReEngagementInput {
  customerName: string
  pastService: string
  monthsSince: string
  seasonalContext?: string
}

export interface FollowUpInput {
  customerName: string
  quotedAmount: string
  daysSince: string
}

export interface CustomMessageInput {
  situation: string
}

async function callClaude(
  system: string,
  userContent: string,
  actionName: string
): Promise<{ text: string; usedFallback?: boolean }> {
  const start = Date.now()
  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: userContent }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    await logAction({
      action: actionName,
      tool: 'message',
      inputSummary: userContent.slice(0, 100),
      outputSummary: text.slice(0, 100),
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      durationMs: Date.now() - start,
      success: true,
    })

    return { text }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error(`[message] ${actionName} failed:`, error)
    await logAction({
      action: actionName,
      tool: 'message',
      inputSummary: userContent.slice(0, 100),
      outputSummary: '',
      durationMs: Date.now() - start,
      success: false,
      error,
    })
    return { text: getFallback('message'), usedFallback: true }
  }
}

export async function generateReEngagement(
  input: ReEngagementInput
): Promise<{ text: string; usedFallback?: boolean }> {
  const settings = await readSettings()
  const context = buildBusinessContext(settings)
  return callClaude(
    `${context}

Write a re-engagement SMS for a past customer of ${settings.businessName}.
First name only, reference their past service, add a timely hook.
Under 160 chars. ${settings.tone} tone. No pressure.`,
    `Customer first name: ${input.customerName.split(' ')[0]}
Past service: ${input.pastService}
Months since last job: ${input.monthsSince}
Seasonal context: ${input.seasonalContext || 'none'}`,
    'generateReEngagement'
  )
}

export async function generateFollowUp(
  input: FollowUpInput
): Promise<{ text: string; usedFallback?: boolean }> {
  const settings = await readSettings()
  const context = buildBusinessContext(settings)
  return callClaude(
    `${context}

Write a soft follow-up SMS for ${settings.businessName}. Customer got a quote but hasn't booked.
Be friendly not pushy. Mention same-day availability as a hook. Under 160 chars.`,
    `Customer first name: ${input.customerName.split(' ')[0]}
Quoted amount: ${input.quotedAmount}
Days since last contact: ${input.daysSince}`,
    'generateFollowUp'
  )
}

export async function generateCustomMessage(
  input: CustomMessageInput
): Promise<{ text: string; usedFallback?: boolean }> {
  const settings = await readSettings()
  const context = buildBusinessContext(settings)
  return callClaude(
    `${context}

You are a message writer for ${settings.businessName}. Based on the situation described,
write the most appropriate SMS message. Under 160 chars.
Match the ${settings.tone} tone of ${settings.businessName}: friendly, direct, locally owned.`,
    input.situation,
    'generateCustomMessage'
  )
}
