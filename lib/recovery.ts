import { storageGet, storageSet, KEYS } from './storage'

interface RecoveryCode {
  code: string
  expiresAt: string
  used: boolean
}

export async function generateRecoveryCode(): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  await storageSet(KEYS.RECOVERY_CODE, { code, expiresAt, used: false })
  return code
}

export async function validateRecoveryCode(input: string): Promise<boolean> {
  const stored = await storageGet<RecoveryCode | null>(KEYS.RECOVERY_CODE, null)
  if (!stored) return false
  if (stored.code !== input) return false
  if (stored.used) return false
  if (new Date(stored.expiresAt) < new Date()) return false
  await storageSet(KEYS.RECOVERY_CODE, { ...stored, used: true })
  return true
}

export async function setPasswordOverride(newPassword: string): Promise<void> {
  await storageSet(KEYS.PASSWORD_OVERRIDE, newPassword)
}

export async function getPasswordOverride(): Promise<string | null> {
  return storageGet<string | null>(KEYS.PASSWORD_OVERRIDE, null)
}
