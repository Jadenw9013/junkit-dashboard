'use server'

import { readSettings, buildBusinessContext } from '@/lib/settings'
import { readFeedback } from '@/lib/feedback'
import { storageGet, KEYS } from '@/lib/storage'
import { AuditEntry, FeedbackEntry } from '@/lib/types'

export async function getAdminData(): Promise<{
  auditEntries: AuditEntry[]
  feedbackEntries: FeedbackEntry[]
  health: {
    jobsCount: number
    customersCount: number
    auditCount: number
    feedbackCount: number
    sessionsCount: number
    settingsVersion: number
    settingsUpdatedAt: string
    anthropicKeySet: boolean
    anthropicKeyPreview: string
    dashboardPasswordSet: boolean
    developerSecretSet: boolean
    storageBackend: 'kv' | 'file'
  }
}> {
  const [auditEntries, feedbackEntries, settings] = await Promise.all([
    storageGet<AuditEntry[]>(KEYS.AUDIT, []),
    readFeedback(),
    readSettings(),
  ])

  const [jobs, customers, sessions] = await Promise.all([
    storageGet<unknown[]>(KEYS.JOBS, []),
    storageGet<unknown[]>(KEYS.CUSTOMERS, []),
    storageGet<unknown[]>(KEYS.SESSIONS, []),
  ])

  const apiKey = process.env.ANTHROPIC_API_KEY || ''
  const isKV = Boolean(process.env.KV_REST_API_URL)

  return {
    auditEntries: auditEntries.slice(-50).reverse(),
    feedbackEntries,
    health: {
      jobsCount: jobs.length,
      customersCount: customers.length,
      auditCount: auditEntries.length,
      feedbackCount: feedbackEntries.length,
      sessionsCount: sessions.length,
      settingsVersion: settings.version,
      settingsUpdatedAt: settings.updatedAt,
      anthropicKeySet: !!apiKey,
      anthropicKeyPreview: apiKey ? apiKey.slice(0, 8) + '***' : '',
      dashboardPasswordSet: !!process.env.DASHBOARD_PASSWORD,
      developerSecretSet: !!process.env.DEVELOPER_SECRET,
      storageBackend: isKV ? 'kv' : 'file',
    },
  }
}

export async function getPromptPreview(tool: string): Promise<string> {
  const settings = await readSettings()
  const context = buildBusinessContext(settings)

  const prompts: Record<string, string> = {
    lead: `${context}

You are a response assistant for ${settings.businessName}. Given a customer inquiry, produce TWO responses:
1. SMS (under 160 characters): ${settings.tone}, direct, includes price range if appropriate, signs off as '${settings.businessName}'
2. EMAIL (3-4 short paragraphs): professional but warm, confirms service area, gives price range if appropriate, explains next step is a quick call to confirm details, never promises same-day without owner confirmation

Format your response as JSON:
{ "sms": "...", "email": "..." }`,

    scope: `${context}

You are a job scoping assistant for ${settings.businessName}. Analyze the job details and return a structured quote estimate as JSON:
{
  "priceMin": number,
  "priceMax": number,
  "truckSize": "quarter" | "half" | "full",
  "timeEstimate": string,
  "verbalQuote": string,
  "flags": string[],
  "confidence": "high" | "medium" | "low"
}

verbalQuote is a single sentence the owner reads aloud to the customer.
flags are any complications worth noting.
Use the pricing from the business context above.`,

    jobdone: `${context}

Write a review request SMS for ${settings.businessName}, a local junk removal business.
Use the customer's first name. Reference the specific service.
Be warm and genuine — sound like a real person, not a template.
Keep it under 160 characters.
End with this exact link: ${settings.googleReviewLink}`,

    message: `${context}

Write a re-engagement SMS for a past customer of ${settings.businessName}.
First name only, reference their past service, add a timely hook.
Under 160 chars. ${settings.tone} tone. No pressure.`,
  }

  return prompts[tool] || 'Unknown tool'
}
