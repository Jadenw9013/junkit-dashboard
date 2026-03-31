// Node.js-only session storage. NEVER import this from middleware.ts.
// For middleware use lib/sessions-edge.ts instead.

import fs from 'fs/promises'
import path from 'path'
import { createSignedToken } from './sessions-edge'

interface Session {
  token: string
  createdAt: string
  expiresAt: string
  ipAddress: string
}

const SESSIONS_PATH = path.join(process.cwd(), 'data', 'sessions.json')
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

async function readSessions(): Promise<Session[]> {
  try {
    const content = await fs.readFile(SESSIONS_PATH, 'utf-8')
    if (!content.trim()) return []
    return JSON.parse(content) as Session[]
  } catch {
    return []
  }
}

async function writeSessions(sessions: Session[]): Promise<void> {
  await fs.writeFile(SESSIONS_PATH, JSON.stringify(sessions, null, 2), 'utf-8')
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
