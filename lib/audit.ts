import { AuditEntry } from './types'
import { storageGet, storageSet, KEYS } from './storage'

const MAX_ENTRIES = 500
const DROP_COUNT = 100

async function readAudit(): Promise<AuditEntry[]> {
  return storageGet<AuditEntry[]>(KEYS.AUDIT, [])
}

export async function logAction(
  entry: Omit<AuditEntry, 'id' | 'timestamp'>
): Promise<void> {
  try {
    const entries = await readAudit()
    const newEntry: AuditEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    entries.push(newEntry)
    const trimmed =
      entries.length > MAX_ENTRIES ? entries.slice(entries.length - (MAX_ENTRIES - DROP_COUNT)) : entries
    await storageSet(KEYS.AUDIT, trimmed)
  } catch {
    // Audit failure must never break the main flow
  }
}

export async function getRecentAuditEntries(limit: number): Promise<AuditEntry[]> {
  const entries = await readAudit()
  return entries.slice(-limit).reverse()
}

export async function getTodayAuditCount(): Promise<number> {
  const entries = await readAudit()
  const today = new Date().toISOString().slice(0, 10)
  return entries.filter((e) => e.timestamp.startsWith(today)).length
}
