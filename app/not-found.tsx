import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#F7F6F1' }}>
      <h1 className="text-4xl font-black tracking-widest mb-2" style={{ color: '#F5C518', fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
        404
      </h1>
      <p className="text-lg mb-6" style={{ color: '#6B7280' }}>Page not found</p>
      <Link href="/"
        className="px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
        style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
        Back to Dashboard
      </Link>
    </div>
  )
}
