import { kv } from '@vercel/kv'

export { kv }

/**
 * Whether Vercel KV is available.
 * In production on Vercel, KV_REST_API_URL is auto-injected.
 * In development, it may be present in .env.local — or absent for file fallback.
 */
export const isKVAvailable = (): boolean =>
  Boolean(process.env.KV_REST_API_URL)
