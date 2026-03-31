'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push('/admin')
      } else {
        setError('Invalid credentials')
      }
    } catch {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-4 p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-xl font-bold text-gray-800 mb-1">Developer Access</h1>
        <p className="text-sm text-gray-500 mb-6">Enter your developer secret to continue.</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Developer secret"
          autoFocus
          className="w-full px-4 py-3 rounded-lg text-sm border border-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 mb-4"
          style={{ backgroundColor: '#fff', color: '#1f2937' }}
        />

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button type="submit" disabled={loading || !password}
          className="w-full py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-50"
          style={{ backgroundColor: '#3b82f6' }}>
          {loading ? 'Verifying...' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
