// Node.js-only session storage. NEVER import this from middleware.ts.
// For middleware use lib/sessions-edge.ts instead.

import { createSignedToken } from './sessions-edge'
import { storageGet, storageSet, KEYS } from './storage'

interface Session {
  token: string
  createdAt: string
  expiresAt: string
  ipAddress: string
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

async function readSessions(): Promise<Session[]> {
  return storageGet<Session[]>(KEYS.SESSIONS, [])
}

async function writeSessions(sessions: Session[]): Promise<void> {
  await storageSet(KEYS.SESSIONS, sessions)
}

export async function createSession(ip: string): Promise<string> {
  const sessions = await readSessions()
  const now = Date.now()
  const id = crypto.randomUUID()
  const expiresAt = now + SESSION_TTL_MS
  const token = await createSignedToken(id, expiresAt)

  const newSession: Session = {
    token,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(expiresAt).toISOString(),
    ipAddress: ip,
  }
  const active = sessions.filter((s) => new Date(s.expiresAt).getTime() > now)
  active.push(newSession)
  await writeSessions(active)
  return token
}

export async function deleteSession(token: string): Promise<void> {
  const sessions = await readSessions()
  const filtered = sessions.filter((s) => s.token !== token)
  await writeSessions(filtered)
}

export async function deleteExpiredSessions(): Promise<void> {
  const sessions = await readSessions()
  const now = Date.now()
  const active = sessions.filter((s) => new Date(s.expiresAt).getTime() > now)
  await writeSessions(active)
}
