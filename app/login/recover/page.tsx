'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.12)',
  color: '#2D2D2D',
}

export default function RecoverPage() {
  const router = useRouter()
  const [step, setStep] = useState<'request' | 'verify' | 'done'>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState('')

  async function handleRequestCode() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/recovery?action=request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.devCode) setDevCode(data.devCode)
      setStep('verify')
    } catch {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  async function handleVerify() {
    if (!code.trim() || !newPassword.trim()) return
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/recovery?action=verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, newPassword }),
      })
      if (res.ok) {
        setStep('done')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid or expired code')
      }
    } catch {
      setError('Something went wrong. Try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="w-full max-w-[400px] mx-4">
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {step === 'request' && (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: '#2D2D2D' }}>Account recovery</h1>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                Enter your email to receive a 6-digit recovery code.
              </p>
              <input
                type="email"
                placeholder="Recovery email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRequestCode()}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
                style={inputStyle}
              />
              {error && <p className="text-xs mb-3" style={{ color: '#ef4444' }}>{error}</p>}
              <button
                onClick={handleRequestCode}
                disabled={loading || !email.trim()}
                className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ backgroundColor: '#F5C518', color: '#2D2D2D' }}
              >
                {loading ? 'Sending...' : 'Send code'}
              </button>
            </>
          )}

          {step === 'verify' && (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: '#2D2D2D' }}>Enter recovery code</h1>
              <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
                Enter the 6-digit code sent to your email.
              </p>

              {devCode && (
                <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <p className="text-xs font-semibold" style={{ color: '#d97706' }}>Dev mode: your code is {devCode}</p>
                </div>
              )}

              <input
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3 text-center tracking-[0.3em] font-mono"
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3"
                style={inputStyle}
              />
              {error && <p className="text-xs mb-3" style={{ color: '#ef4444' }}>{error}</p>}
              <button
                onClick={handleVerify}
                disabled={loading || code.length !== 6 || !newPassword}
                className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ backgroundColor: '#F5C518', color: '#2D2D2D' }}
              >
                {loading ? 'Verifying...' : 'Reset password'}
              </button>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-4">
              <p className="text-lg font-semibold mb-2" style={{ color: '#22c55e' }}>Password updated ✓</p>
              <p className="text-sm" style={{ color: '#6B7280' }}>Redirecting to login...</p>
            </div>
          )}

          <div className="text-center mt-4">
            <Link href="/login" className="text-xs" style={{ color: '#6B7280' }}>← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
