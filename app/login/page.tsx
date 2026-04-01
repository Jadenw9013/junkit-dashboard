'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [lockoutMsg, setLockoutMsg] = useState('')
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setLockoutMsg('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      return
    }

    const data = await res.json()

    if (res.status === 429) {
      setLockoutMsg(`Too many failed attempts. Try again in ${data.minutesRemaining ?? '15'} minutes.`)
    } else {
      const remaining = data.attemptsRemaining ?? null
      setAttemptsRemaining(remaining)
      setError('Incorrect password')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="w-full max-w-sm mx-4 rounded-xl p-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-wider mb-1" style={{ color: '#2D2D2D', fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
            JUNK<span style={{ color: '#F5C518' }}>▲</span>IT
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>Owner Dashboard</p>
        </div>

        {lockoutMsg && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
            <p className="text-xs" style={{ color: '#92400e' }}>{lockoutMsg}</p>
          </div>
        )}

        {attemptsRemaining !== null && attemptsRemaining <= 2 && !lockoutMsg && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
            <p className="text-xs" style={{ color: '#92400e' }}>
              Warning: {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-lg text-base outline-none"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.12)', color: '#2D2D2D' }}
            autoFocus
          />
          {error && !lockoutMsg && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <button type="submit" disabled={loading || !!lockoutMsg}
            className="w-full py-3 rounded-lg font-semibold text-base transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#F5C518', color: '#2D2D2D' }}>
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
        <div className="text-center mt-3">
          <Link href="/login/recover" className="text-xs" style={{ color: '#6B7280' }}>Forgot password?</Link>
        </div>
      </div>
    </div>
  )
}
