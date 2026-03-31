/**
 * Simple in-memory rate limiter — resets on cold start.
 * Fine for a single-user dashboard.
 */

interface RateLimitState {
  count: number
  windowStart: number
}

const limits = new Map<string, RateLimitState>()

const WINDOW_MS = 3600000 // 1 hour

const TOOL_LIMITS: Record<string, number> = {
  lead: 30,
  scope: 30,
  jobdone: 50,
  message: 40,
}

export function checkRateLimit(
  tool: string
): { allowed: boolean; remaining: number } {
  const maxPerHour = TOOL_LIMITS[tool] ?? 30
  const key = `ai-${tool}`
  const now = Date.now()
  const state = limits.get(key)

  if (!state || now - state.windowStart > WINDOW_MS) {
    limits.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: maxPerHour - 1 }
  }

  if (state.count >= maxPerHour) {
    return { allowed: false, remaining: 0 }
  }

  state.count++
  return { allowed: true, remaining: maxPerHour - state.count }
}
