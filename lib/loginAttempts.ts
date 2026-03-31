import { storageGet, storageSet, KEYS } from './storage'

interface AttemptRecord {
  ip: string
  attempts: number
  lastAttempt: string
  lockedUntil: string | null
}

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

async function readAttempts(): Promise<AttemptRecord[]> {
  return storageGet<AttemptRecord[]>(KEYS.LOGIN_ATTEMPTS, [])
}

async function writeAttempts(records: AttemptRecord[]): Promise<void> {
  await storageSet(KEYS.LOGIN_ATTEMPTS, records)
}

export async function checkLockout(
  ip: string
): Promise<{ locked: boolean; minutesRemaining?: number }> {
  const records = await readAttempts()
  const record = records.find((r) => r.ip === ip)
  if (!record || !record.lockedUntil) return { locked: false }

  const lockedUntil = new Date(record.lockedUntil).getTime()
  const now = Date.now()
  if (lockedUntil > now) {
    const minutesRemaining = Math.ceil((lockedUntil - now) / 60000)
    return { locked: true, minutesRemaining }
  }
  return { locked: false }
}

export async function recordFailedAttempt(ip: string): Promise<{ attempts: number }> {
  const records = await readAttempts()
  const idx = records.findIndex((r) => r.ip === ip)
  const now = new Date().toISOString()

  if (idx === -1) {
    records.push({ ip, attempts: 1, lastAttempt: now, lockedUntil: null })
    await writeAttempts(records)
    return { attempts: 1 }
  }

  records[idx].attempts += 1
  records[idx].lastAttempt = now

  if (records[idx].attempts >= MAX_ATTEMPTS) {
    records[idx].lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
    records[idx].attempts = 0
  }

  await writeAttempts(records)
  return { attempts: records[idx].attempts }
}

export async function recordSuccessfulLogin(ip: string): Promise<void> {
  const records = await readAttempts()
  const filtered = records.filter((r) => r.ip !== ip)
  await writeAttempts(filtered)
}

export function getAttemptsRemaining(attempts: number): number {
  return Math.max(0, MAX_ATTEMPTS - attempts)
}
