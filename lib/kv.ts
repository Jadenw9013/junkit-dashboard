import { Redis } from '@upstash/redis'

/**
 * Whether KV (Upstash Redis) is available.
 * In production on Vercel, KV_REST_API_URL is auto-injected.
 * In development, it's absent — fall back to file-based storage.
 */
export const isKVAvailable = (): boolean =>
  Boolean(process.env.KV_REST_API_URL)

/**
 * Lazy singleton Redis client — only created when KV is available.
 */
let _redis: Redis | null = null

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  }
  return _redis
}
