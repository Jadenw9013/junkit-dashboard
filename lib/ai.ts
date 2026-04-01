import { generateObject, generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { readSettings } from './settings'
import { buildBusinessContext } from './settings'
import { getFallback } from './fallbacks'
import { logAction } from './audit'
import type { MonthlyReport } from './reports'

const model = anthropic('claude-sonnet-4-20250514')

function isAIConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY
  return !!key && key !== 'placeholder_replace_before_use' && key !== 'placeholder'
}

// ─── FUNCTION 1: Lead Response ───

const leadResponseSchema = z.object({
  sms: z.string().max(160).describe('SMS under 160 chars, friendly, includes price range if available'),
  email: z.string().describe('Full email response, 3-4 paragraphs'),
  estimatedPriceMin: z.number().describe('Minimum price estimate'),
  estimatedPriceMax: z.number().describe('Maximum price estimate'),
  truckSize: z.enum(['quarter', 'half', 'full', 'unknown']),
  confidence: z.enum(['high', 'medium', 'low']),
  needsMoreInfo: z.boolean().describe('True if more info needed before quoting'),
  clarifyingQuestion: z.string().optional().describe('If needsMoreInfo, what to ask'),
})

export type LeadResponse = z.infer<typeof leadResponseSchema>

export async function generateLeadResponse(input: {
  inquiry: string
  customerName?: string
  returningCustomer?: boolean
  history?: string
}): Promise<LeadResponse & { usedFallback?: boolean }> {
  if (!isAIConfigured()) {
    const fb = getFallback('lead')
    return {
      sms: fb.sms,
      email: fb.email,
      estimatedPriceMin: 200,
      estimatedPriceMax: 400,
      truckSize: 'unknown',
      confidence: 'low',
      needsMoreInfo: false,
      usedFallback: true,
    }
  }

  const start = Date.now()
  try {
    const settings = await readSettings()
    const context = buildBusinessContext(settings)

    const { object } = await generateObject({
      model,
      schema: leadResponseSchema,
      system: `${context}\n\nYou are an automated response system for ${settings.businessName}. Generate a quote response. IMPORTANT: Never promise an exact price. Always use a range and state the owner will confirm on arrival. The SMS will be sent automatically to the customer within 60 seconds.${input.returningCustomer ? '\nThis is a RETURNING customer — be warm and reference their loyalty.' : ''}`,
      prompt: `Customer inquiry:\n${input.inquiry}${input.customerName ? `\nCustomer name: ${input.customerName}` : ''}${input.history ? `\nPrevious history: ${input.history}` : ''}`,
    })

    await logAction({
      action: 'generateLeadResponse',
      tool: 'ai',
      inputSummary: input.inquiry.slice(0, 100),
      outputSummary: object.sms.slice(0, 100),
      durationMs: Date.now() - start,
      success: true,
    })

    return { ...object, usedFallback: false }
  } catch (err) {
    console.error('[AI] generateLeadResponse failed:', err)
    await logAction({
      action: 'generateLeadResponse',
      tool: 'ai',
      inputSummary: input.inquiry.slice(0, 100),
      outputSummary: `Error: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
      success: false,
      error: err instanceof Error ? err.message : String(err),
    })

    const fb = getFallback('lead')
    return {
      sms: fb.sms,
      email: fb.email,
      estimatedPriceMin: 200,
      estimatedPriceMax: 400,
      truckSize: 'unknown',
      confidence: 'low',
      needsMoreInfo: false,
      usedFallback: true,
    }
  }
}

// ─── FUNCTION 2: Follow-Up Message ───

const followUpSchema = z.object({
  sms: z.string().max(160),
  shouldSend: z.boolean().describe('False if this lead is too old to follow up on'),
  reason: z.string().describe('Why shouldSend is true or false'),
})

export type FollowUpResult = z.infer<typeof followUpSchema>

export async function generateFollowUpMessage(input: {
  customerName: string
  city: string
  service: string
  daysSince: number
  originalInquiry?: string
}): Promise<FollowUpResult> {
  if (!isAIConfigured()) {
    return {
      sms: `Hi ${input.customerName.split(' ')[0]}! Just following up from Junk It — still need help with that pickup in ${input.city}? We have same-day availability. Reply or call anytime!`,
      shouldSend: input.daysSince <= 14,
      reason: 'Fallback — AI not configured',
    }
  }

  try {
    const settings = await readSettings()
    const context = buildBusinessContext(settings)

    const { object } = await generateObject({
      model,
      schema: followUpSchema,
      system: `${context}\n\nWrite a soft follow-up SMS for ${settings.businessName}. Be friendly not pushy. Mention same-day availability. Under 160 chars. Set shouldSend to false if the lead is older than 21 days.`,
      prompt: `Customer: ${input.customerName}\nCity: ${input.city}\nService: ${input.service}\nDays since inquiry: ${input.daysSince}${input.originalInquiry ? `\nOriginal inquiry: ${input.originalInquiry}` : ''}`,
    })

    return object
  } catch (err) {
    console.error('[AI] generateFollowUpMessage failed:', err)
    return {
      sms: `Hi ${input.customerName.split(' ')[0]}! Following up from Junk It — still need pickup help in ${input.city}? We have same-day availability!`,
      shouldSend: input.daysSince <= 14,
      reason: `Fallback — ${err instanceof Error ? err.message : 'unknown error'}`,
    }
  }
}

// ─── FUNCTION 3: Re-engagement Message ───

const reengagementSchema = z.object({
  sms: z.string().max(160),
  subject: z.string().describe('Email subject if also emailing'),
})

export type ReengagementResult = z.infer<typeof reengagementSchema>

export async function generateReengagementMessage(input: {
  customerName: string
  lastService: string
  monthsSince: number
  city: string
}): Promise<ReengagementResult> {
  if (!isAIConfigured()) {
    return {
      sms: `Hey ${input.customerName.split(' ')[0]}! It's been a while — Junk It here. Need anything hauled in ${input.city}? We'd love to help again!`,
      subject: `We miss you, ${input.customerName.split(' ')[0]}!`,
    }
  }

  try {
    const settings = await readSettings()
    const context = buildBusinessContext(settings)

    const { object } = await generateObject({
      model,
      schema: reengagementSchema,
      system: `${context}\n\nWrite a re-engagement SMS for ${settings.businessName}. This is a past customer who hasn't used the service in months. Be warm and casual. Mention a seasonal angle if relevant. Under 160 chars.`,
      prompt: `Customer: ${input.customerName}\nLast service: ${input.lastService}\nMonths since last job: ${input.monthsSince}\nCity: ${input.city}`,
    })

    return object
  } catch (err) {
    console.error('[AI] generateReengagementMessage failed:', err)
    return {
      sms: `Hey ${input.customerName.split(' ')[0]}! Junk It here — need anything hauled in ${input.city}? We'd love to work with you again!`,
      subject: `We miss you, ${input.customerName.split(' ')[0]}!`,
    }
  }
}

// ─── FUNCTION 4: Acknowledgment SMS ───

const acknowledgmentSchema = z.object({
  sms: z.string().max(160),
})

export async function generateAcknowledgmentSMS(input: {
  customerName: string
  service: string
}): Promise<{ sms: string }> {
  if (!isAIConfigured()) {
    return {
      sms: `Hi ${input.customerName.split(' ')[0]}! Thanks for reaching out to Junk It. We got your request and will send a quote within the hour!`,
    }
  }

  try {
    const settings = await readSettings()

    const { object } = await generateObject({
      model,
      schema: acknowledgmentSchema,
      system: `Write a brief acknowledgment SMS for ${settings.businessName}. Customer just submitted a form. Tell them we got it and will send a quote within the hour. Friendly, under 160 chars, sign off as ${settings.businessName}.`,
      prompt: `Customer: ${input.customerName}\nService: ${input.service}`,
    })

    return object
  } catch (err) {
    console.error('[AI] generateAcknowledgmentSMS failed:', err)
    return {
      sms: `Hi ${input.customerName.split(' ')[0]}! Thanks for reaching out to Junk It. We got your request and will send a quote shortly!`,
    }
  }
}

// ─── FUNCTION 5: Monthly Report Email ───

const reportEmailSchema = z.object({
  subject: z.string(),
  summary: z.string().describe('Plain English 3-4 sentence summary for the owner'),
  highlights: z.array(z.string()).describe('3 notable things from this month'),
  suggestion: z.string().describe('One actionable suggestion for next month based on the data'),
})

export type ReportEmailResult = z.infer<typeof reportEmailSchema>

export async function generateMonthlyReportEmail(
  report: MonthlyReport
): Promise<ReportEmailResult> {
  if (!isAIConfigured()) {
    return {
      subject: `${report.month} — Monthly Report`,
      summary: `You completed ${report.summary.totalJobs} jobs and earned $${report.summary.totalRevenue} in ${report.month}.`,
      highlights: [
        `${report.summary.totalJobs} total jobs completed`,
        `$${report.summary.totalRevenue} total revenue`,
        `${report.summary.newCustomers} new customers`,
      ],
      suggestion: 'Keep building your customer base through consistent service.',
    }
  }

  try {
    const { object } = await generateObject({
      model,
      schema: reportEmailSchema,
      system: 'Generate a monthly business report email for a junk removal company owner. Be encouraging and data-driven. Include specific numbers from the data.',
      prompt: `Monthly Report Data:\nMonth: ${report.month}\nTotal Jobs: ${report.summary.totalJobs}\nTotal Revenue: $${report.summary.totalRevenue}\nAvg Job Value: $${report.summary.avgJobValue}\nNew Customers: ${report.summary.newCustomers}\nReturning Customers: ${report.summary.returningCustomers}\nConversion Rate: ${report.summary.conversionRate}%\nTop Cities: ${report.byCity.slice(0, 3).map(c => `${c.city} (${c.count} jobs)`).join(', ')}`,
    })

    return object
  } catch (err) {
    console.error('[AI] generateMonthlyReportEmail failed:', err)
    return {
      subject: `${report.month} — Monthly Report`,
      summary: `You completed ${report.summary.totalJobs} jobs and earned $${report.summary.totalRevenue} in ${report.month}.`,
      highlights: [
        `${report.summary.totalJobs} total jobs`,
        `$${report.summary.totalRevenue} revenue`,
        `${report.summary.conversionRate}% conversion rate`,
      ],
      suggestion: 'Review your pricing and follow up with unconverted leads.',
    }
  }
}
