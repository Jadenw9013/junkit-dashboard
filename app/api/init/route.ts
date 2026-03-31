import { NextRequest, NextResponse } from 'next/server'
import { storageGet, storageSet, storageExists, KEYS } from '@/lib/storage'
import { DEFAULT_SETTINGS } from '@/lib/settings'
import { isKVAvailable } from '@/lib/kv'

const KEY_DEFAULTS: { key: typeof KEYS[keyof typeof KEYS]; defaultValue: unknown }[] = [
  { key: KEYS.JOBS, defaultValue: [] },
  { key: KEYS.CUSTOMERS, defaultValue: [] },
  { key: KEYS.SESSIONS, defaultValue: [] },
  { key: KEYS.LOGIN_ATTEMPTS, defaultValue: [] },
  { key: KEYS.AUDIT, defaultValue: [] },
  { key: KEYS.FEEDBACK, defaultValue: [] },
  { key: KEYS.SETTINGS_HISTORY, defaultValue: [] },
  { key: KEYS.SETTINGS, defaultValue: DEFAULT_SETTINGS },
]

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-developer-secret')
  if (!secret || secret !== process.env.DEVELOPER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const initialized: string[] = []
  const alreadyExisted: string[] = []
  const backend = isKVAvailable() ? 'kv' : 'file'

  for (const { key, defaultValue } of KEY_DEFAULTS) {
    const exists = await storageExists(key)
    if (!exists) {
      await storageSet(key, defaultValue)
      initialized.push(key)
    } else {
      alreadyExisted.push(key)
    }
  }

  return NextResponse.json({
    backend,
    initialized,
    alreadyExisted,
    total: KEY_DEFAULTS.length,
    message: `[${backend}] ${initialized.length} key(s) initialized, ${alreadyExisted.length} already existed.`,
  })
}
