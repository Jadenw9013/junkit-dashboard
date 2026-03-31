'use client'

import Link from 'next/link'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: '#2D2D2D' }}>Something went wrong</h1>
      <p className="text-sm mb-6" style={{ color: '#6B7280' }}>An unexpected error occurred.</p>
      <div className="flex gap-3">
        <button onClick={reset}
          className="px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
          Try again
        </button>
        <Link href="/"
          className="px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.3)', color: '#F5C518' }}>
          Go home
        </Link>
      </div>
    </div>
  )
}
