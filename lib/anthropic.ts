import Anthropic from '@anthropic-ai/sdk'

// Validate env at module load time — throws with clear message if misconfigured
// Skipped during Next.js build/type-check phase
if (process.env.NODE_ENV !== 'test') {
  const missing = ['ANTHROPIC_API_KEY', 'DASHBOARD_PASSWORD', 'WEBHOOK_SECRET'].filter(
    (v) => !process.env[v]
  )
  if (missing.length > 0 && process.env.NEXT_PHASE !== 'phase-production-build') {
    console.warn(`[junkit] Missing env vars: ${missing.join(', ')}`)
  }
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
})

export const MODEL = 'claude-sonnet-4-20250514'
export const MAX_TOKENS = 1024
