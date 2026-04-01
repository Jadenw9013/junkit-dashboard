import Sidebar from '@/components/Sidebar'
import ApprovalsClient from './ApprovalsClient'

export const metadata = { title: 'Pending Approvals — Junk It' }

export default function ApprovalsPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Sidebar activePath="/approvals" />
      <main style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{
          fontFamily: 'var(--font-barlow-condensed, sans-serif)',
          fontWeight: 800, fontSize: '1.5rem', color: 'var(--navy)',
          marginBottom: '0.25rem',
        }}>
          Pending Approvals
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--gray)', marginBottom: '1.5rem' }}>
          AI-generated messages ready for your review before sending.
        </p>
        <ApprovalsClient />
      </main>
    </div>
  )
}
