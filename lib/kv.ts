import Redis from 'ioredis'

/**
 * Whether Redis is available (REDIS_URL env var is set).
 */
export const isKVAvailable = (): boolean =>
  Boolean(process.env.REDIS_URL)

/**
 * Lazy singleton Redis client.
 * ioredis connects via TCP using the standard redis:// connection string.
 */
let _redis: Redis | null = null

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  }
  return _redis
}
