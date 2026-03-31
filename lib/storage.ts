import fs from 'fs/promises'
import path from 'path'
import { isKVAvailable, kv } from './kv'

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
} as const

type StorageKey = (typeof KEYS)[keyof typeof KEYS]

/* ────────────────────────────────────────
 * File-based helpers (development only)
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
 * KV helpers (production — Vercel KV)
 *
 * @vercel/kv auto-serializes/deserializes JSON.
 * Do NOT wrap with JSON.parse or JSON.stringify.
 * ──────────────────────────────────────── */

async function kvGet<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const result = await kv.get<T>(key)
    return result ?? fallback
  } catch (err) {
    console.error(`[storage] KV get '${key}' failed:`, err)
    return fallback
  }
}

async function kvSet<T>(key: StorageKey, value: T): Promise<void> {
  try {
    await kv.set(key, value)
  } catch (err) {
    console.error(`[storage] KV set '${key}' failed:`, err)
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
      return (await kv.exists(key)) === 1
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
