const REQUIRED_VARS = ['DASHBOARD_PASSWORD', 'WEBHOOK_SECRET']

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Check your .env.local file.'
    )
  }
}

// ─── Automation Config Check ───

const AUTOMATION_VARS: { key: string; label: string }[] = [
  { key: 'ANTHROPIC_API_KEY', label: 'AI (Anthropic)' },
  { key: 'TRIGGER_SECRET_KEY', label: 'Background Jobs (Trigger.dev)' },
  { key: 'TELNYX_API_KEY', label: 'SMS (Telnyx)' },
  { key: 'TELNYX_PHONE_NUMBER', label: 'SMS Phone Number' },
  { key: 'OWNER_PHONE_NUMBER', label: 'Owner Phone' },
  { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Database (Supabase)' },
]

const PLACEHOLDER_VALUES = [
  'placeholder', 'placeholder_replace_before_use',
  '+14250000000', '+14251234567',
]

function isConfigured(key: string): boolean {
  const val = process.env[key]
  if (!val) return false
  return !PLACEHOLDER_VALUES.includes(val)
}

export interface AutomationConfigResult {
  configured: { key: string; label: string }[]
  missing: { key: string; label: string }[]
  ready: boolean
  total: number
}

export function checkAutomationConfig(): AutomationConfigResult {
  const configured: { key: string; label: string }[] = []
  const missing: { key: string; label: string }[] = []

  for (const v of AUTOMATION_VARS) {
    if (isConfigured(v.key)) {
      configured.push(v)
    } else {
      missing.push(v)
    }
  }

  const ready = missing.length === 0

  console.log(
    `[ENV] Automation status: ${configured.length}/${AUTOMATION_VARS.length} services configured`
  )

  return { configured, missing, ready, total: AUTOMATION_VARS.length }
}
