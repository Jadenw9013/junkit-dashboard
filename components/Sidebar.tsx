import Link from 'next/link'
import { LayoutGrid, Inbox, MessageSquare, ClipboardCheck, CheckCircle, Send, Zap, Users, BarChart3, Settings, HelpCircle, Bell } from 'lucide-react'
import { getUnreadLeadCount } from '@/lib/jobs'
import { readSettings } from '@/lib/settings'
import { storageGet, KEYS } from '@/lib/storage'
import SidebarLogout from './SidebarLogout'

const toolsNav = [
  { href: '/', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/inbox', label: 'Lead Inbox', Icon: Inbox, hasBadge: true },
  { href: '/lead', label: 'New Lead', Icon: MessageSquare },
  { href: '/scope', label: 'Scope a Job', Icon: ClipboardCheck },
  { href: '/jobdone', label: 'Job Done', Icon: CheckCircle },
  { href: '/message', label: 'Send Message', Icon: Send },
  { href: '/quicklog', label: 'Quick Log', Icon: Zap },
  { href: '/approvals', label: 'Approvals', Icon: Bell, hasPendingBadge: true },
]

const businessNav = [
  { href: '/customers', label: 'Customers', Icon: Users },
  { href: '/report', label: 'Monthly Report', Icon: BarChart3 },
  { href: '/settings', label: 'Settings', Icon: Settings },
  { href: '/help', label: 'Help', Icon: HelpCircle },
]

export default async function Sidebar({ activePath }: { activePath: string }) {
  const [unreadCount, settings] = await Promise.all([
    getUnreadLeadCount(),
    readSettings(),
  ])

  // Count pending approvals for badge
  let pendingCount = 0
  try {
    const followups = await storageGet<{ items?: unknown[] } | null>(KEYS.PENDING_FOLLOWUPS, null)
    const reengagements = await storageGet<{ items?: unknown[] } | null>(KEYS.PENDING_REENGAGEMENTS, null)
    pendingCount = (followups?.items?.length ?? 0) + (reengagements?.items?.length ?? 0)
  } catch { /* ignore */ }

  const ownerName = settings.ownerName || 'Owner'
  const bizName = settings.businessName || 'Junk It'

  return (
    <aside style={{
      width: 240, minHeight: '100vh', backgroundColor: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800, fontSize: '1.5rem', color: 'var(--navy)', letterSpacing: '0.08em' }}>
          JUNK<span style={{ display: 'inline-block', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '10px solid var(--gold-light)', margin: '0 2px', verticalAlign: 'middle' }} />IT
        </span>
      </div>

      {/* Owner */}
      <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gray)' }}>OWNER</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy)', marginTop: 2 }}>{ownerName} — {bizName}</div>
      </div>

      {/* Tools Nav */}
      <div style={{ padding: '0.75rem 0.625rem' }}>
        <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gray)', padding: '0 0.25rem', marginBottom: '0.375rem' }}>TOOLS</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {toolsNav.map(({ href, label, Icon, hasBadge, hasPendingBadge }) => {
            const isActive = activePath === href
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '0.5625rem 0.625rem', borderRadius: 7,
                fontSize: '0.9rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--navy)' : 'var(--gray)',
                backgroundColor: isActive ? 'var(--gold-pale)' : 'transparent',
                transition: 'all 0.15s', textDecoration: 'none',
              }}>
                <Icon size={17} style={{ opacity: isActive ? 1 : 0.7 }} />
                <span>{label}</span>
                {hasBadge && unreadCount > 0 && (
                  <span style={{ marginLeft: 'auto', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.625rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                    {unreadCount}
                  </span>
                )}
                {hasPendingBadge && pendingCount > 0 && (
                  <span style={{ marginLeft: 'auto', backgroundColor: 'var(--gold)', color: '#FFFFFF', fontSize: '0.625rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                    {pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Business Nav */}
      <div style={{ padding: '0.25rem 0.625rem' }}>
        <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gray)', padding: '0 0.25rem', marginBottom: '0.375rem' }}>BUSINESS</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {businessNav.map(({ href, label, Icon }) => {
            const isActive = activePath === href
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '0.5625rem 0.625rem', borderRadius: 7,
                fontSize: '0.9rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--navy)' : 'var(--gray)',
                backgroundColor: isActive ? 'var(--gold-pale)' : 'transparent',
                transition: 'all 0.15s', textDecoration: 'none',
              }}>
                <Icon size={17} style={{ opacity: isActive ? 1 : 0.7 }} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout */}
      <div style={{ marginTop: 'auto', padding: '0.875rem 1rem', borderTop: '1px solid var(--border)' }}>
        <SidebarLogout />
      </div>
    </aside>
  )
}
