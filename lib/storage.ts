import fs from 'fs/promises'
import path from 'path'
import { isKVAvailable, getRedis } from './kv'

/* ────────────────────────────────────────
 * Storage key constants
 * ──────────────────────────────────────── */

export const KEYS = {
  JOBS: 'jobs',
  CUSTOMERS: 'customers',
  SESSIONS: 'sessions',
  LOGIN_ATTEMPTS: 'login-attempts',
  AUDIT: 'audit',
  FEEDBACK: 'feedback',
  SETTINGS: 'settings',
  SETTINGS_HISTORY: 'settings-history',
  RECOVERY_CODE: 'recovery-code',
  PASSWORD_OVERRIDE: 'password-override',
} as const

type StorageKey = (typeof KEYS)[keyof typeof KEYS]

/* ────────────────────────────────────────
 * File-based helpers (development fallback)
 * ──────────────────────────────────────── */

const DATA_DIR = path.join(process.cwd(), 'data')

function filePath(key: StorageKey): string {
  return path.join(DATA_DIR, `${key}.json`)
}

async function fileGet<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath(key), 'utf-8')
    if (!content.trim()) return fallback
    return JSON.parse(content) as T
  } catch {
    return fallback
  }
}

async function fileSet<T>(key: StorageKey, value: T): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch { /* ignore */ }
  await fs.writeFile(filePath(key), JSON.stringify(value, null, 2), 'utf-8')
}

/* ────────────────────────────────────────
 * Redis helpers (production — ioredis)
 *
 * ioredis stores/returns raw strings.
 * We JSON.stringify on write, JSON.parse on read.
 * ──────────────────────────────────────── */

async function kvGet<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const redis = getRedis()
    const raw = await redis.get(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch (err) {
    console.error(`[storage] Redis get '${key}' failed:`, err)
    return fallback
  }
}

async function kvSet<T>(key: StorageKey, value: T): Promise<void> {
  try {
    const redis = getRedis()
    await redis.set(key, JSON.stringify(value))
  } catch (err) {
    console.error(`[storage] Redis set '${key}' failed:`, err)
  }
}

/* ────────────────────────────────────────
 * Public API — auto-selects backend
 * ──────────────────────────────────────── */

/**
 * Read a value from storage. Returns `fallback` if key doesn't exist.
 */
export async function storageGet<T>(key: StorageKey, fallback: T): Promise<T> {
  if (isKVAvailable()) {
    return kvGet(key, fallback)
  }
  return fileGet(key, fallback)
}

/**
 * Write a value to storage (overwrites existing).
 */
export async function storageSet<T>(key: StorageKey, value: T): Promise<void> {
  if (isKVAvailable()) {
    return kvSet(key, value)
  }
  return fileSet(key, value)
}

/**
 * Append an item to an array stored at `key`.
 * Optionally trim to `maxItems` (keeps newest).
 */
export async function storageAppend<T>(
  key: StorageKey,
  item: T,
  maxItems?: number
): Promise<void> {
  const arr = await storageGet<T[]>(key, [])
  arr.push(item)
  const trimmed = maxItems && arr.length > maxItems
    ? arr.slice(arr.length - maxItems)
    : arr
  await storageSet(key, trimmed)
}

/**
 * Check whether a key exists in storage.
 */
export async function storageExists(key: StorageKey): Promise<boolean> {
  if (isKVAvailable()) {
    try {
      const redis = getRedis()
      return (await redis.exists(key)) === 1
    } catch {
      return false
    }
  }
  try {
    await fs.access(filePath(key))
    const content = await fs.readFile(filePath(key), 'utf-8')
    return !!content.trim()
  } catch {
    return false
  }
}
