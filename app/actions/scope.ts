'use server'

import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic'
import { addJob } from '@/lib/jobs'
import { ServiceType } from '@/lib/types'
import { readSettings, buildBusinessContext } from '@/lib/settings'
import { logAction } from '@/lib/audit'
import { getFallback } from '@/lib/fallbacks'

export interface ScopeInput {
  customerName: string
  city: string
  service: ServiceType
  description: string
  appliances: boolean
  difficultAccess: boolean
  demoRequired: boolean
}

export interface QuoteResult {
  priceMin: number
  priceMax: number
  truckSize: 'quarter' | 'half' | 'full'
  timeEstimate: string
  verbalQuote: string
  flags: string[]
  confidence: 'high' | 'medium' | 'low'
}

export async function generateQuote(
  input: ScopeInput
): Promise<QuoteResult & { usedFallback?: boolean }> {
  const settings = await readSettings()
  const context = buildBusinessContext(settings)
  const start = Date.now()

  const userContent = `
Customer: ${input.customerName}, ${input.city}
Service: ${input.service}
Description: ${input.description}
Appliances included: ${input.appliances ? 'Yes' : 'No'}
Difficult access: ${input.difficultAccess ? 'Yes' : 'No'}
Demo required: ${input.demoRequired ? 'Yes' : 'No'}
`.trim()

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: `${context}

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
      messages: [{ role: 'user', content: userContent }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Failed to parse AI response')

    const result = JSON.parse(jsonMatch[0]) as QuoteResult

    await logAction({
      action: 'generateQuote',
      tool: 'scope',
      inputSummary: input.description.slice(0, 100),
      outputSummary: result.verbalQuote.slice(0, 100),
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      durationMs: Date.now() - start,
      success: true,
    })

    return result
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.error('[scope] generateQuote failed:', error)
    await logAction({
      action: 'generateQuote',
      tool: 'scope',
      inputSummary: input.description.slice(0, 100),
      outputSummary: '',
      durationMs: Date.now() - start,
      success: false,
      error,
    })
    return { ...getFallback('scope'), usedFallback: true }
  }
}

export async function saveQuotedJob(input: ScopeInput, quote: QuoteResult) {
  const midpoint = Math.round((quote.priceMin + quote.priceMax) / 2)
  const job = await addJob({
    customerName: input.customerName,
    phone: '',
    city: input.city,
    service: input.service,
    status: 'quoted',
    price: midpoint,
    notes: input.description,
  })
  return job
}
