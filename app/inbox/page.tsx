import Sidebar from '@/components/Sidebar'
import InboxClient from './InboxClient'

export const metadata = { title: 'Lead Inbox — Junk It' }

export default function InboxPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <Sidebar activePath="/inbox" />
      <main style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-barlow-condensed, sans-serif)',
            fontWeight: 800, fontSize: '1.5rem', color: 'var(--navy)',
            marginBottom: '0.25rem',
          }}>
            Lead Inbox
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray)' }}>
            Every lead in one place — track status, view AI drafts, and take action.
          </p>
        </div>
        <InboxClient />
      </main>
    </div>
  )
}
