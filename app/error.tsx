'use client'

import Link from 'next/link'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#1a2535' }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#f5f0e8' }}>Something went wrong</h1>
      <p className="text-sm mb-6" style={{ color: '#718096' }}>An unexpected error occurred.</p>
      <div className="flex gap-3">
        <button onClick={reset}
          className="px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#b8964a', color: '#1a2535' }}>
          Try again
        </button>
        <Link href="/"
          className="px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'rgba(184,150,74,0.1)', border: '1px solid rgba(184,150,74,0.3)', color: '#b8964a' }}>
          Go home
        </Link>
      </div>
    </div>
  )
}
