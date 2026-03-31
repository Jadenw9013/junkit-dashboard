const REQUIRED_VARS = ['ANTHROPIC_API_KEY', 'DASHBOARD_PASSWORD', 'WEBHOOK_SECRET']

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((v) => !process.env[v])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Check your .env.local file.'
    )
  }
  if (process.env.ANTHROPIC_API_KEY === 'placeholder_replace_before_use') {
    throw new Error(
      'ANTHROPIC_API_KEY is still set to placeholder value.\n' +
        'Replace it with your real key in .env.local'
    )
  }
}
