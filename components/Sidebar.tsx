import Link from 'next/link'
import { LayoutGrid, MessageSquare, ClipboardCheck, CheckCircle, Send, Zap, Users, BarChart3, Settings, HelpCircle, LogOut } from 'lucide-react'
import { getUnreadLeadCount } from '@/lib/jobs'
import { readSettings } from '@/lib/settings'
import SidebarLogout from './SidebarLogout'

const toolsNav = [
  { href: '/', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/lead', label: 'New Lead', Icon: MessageSquare, hasBadge: true },
  { href: '/scope', label: 'Scope a Job', Icon: ClipboardCheck },
  { href: '/jobdone', label: 'Job Done', Icon: CheckCircle },
  { href: '/message', label: 'Send Message', Icon: Send },
  { href: '/quicklog', label: 'Quick Log', Icon: Zap },
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

  const ownerName = settings.ownerName || 'Owner'
  const bizName = settings.businessName || 'Junk It'

  return (
    <aside style={{ width: 240, minHeight: '100vh', backgroundColor: 'var(--navy)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800, fontSize: '1.5rem', color: '#FFFFFF', letterSpacing: '0.08em' }}>
          JUNK<span style={{ display: 'inline-block', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '10px solid var(--gold-light)', margin: '0 2px', verticalAlign: 'middle' }} />IT
        </span>
      </div>

      {/* Owner */}
      <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>OWNER</div>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{ownerName} — {bizName}</div>
      </div>

      {/* Tools Nav */}
      <div style={{ padding: '0.75rem 0.625rem' }}>
        <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', padding: '0 0.25rem', marginBottom: '0.375rem' }}>TOOLS</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {toolsNav.map(({ href, label, Icon, hasBadge }) => {
            const isActive = activePath === href
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '0.5625rem 0.625rem', borderRadius: 7,
                fontSize: '0.9rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--navy)' : 'rgba(255,255,255,0.55)',
                backgroundColor: isActive ? 'var(--gold-light)' : 'transparent',
                transition: 'all 0.15s', textDecoration: 'none',
              }}>
                <Icon size={17} style={{ opacity: isActive ? 1 : 0.6 }} />
                <span>{label}</span>
                {hasBadge && unreadCount > 0 && (
                  <span style={{ marginLeft: 'auto', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.625rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Business Nav */}
      <div style={{ padding: '0.25rem 0.625rem' }}>
        <div style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', padding: '0 0.25rem', marginBottom: '0.375rem' }}>BUSINESS</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {businessNav.map(({ href, label, Icon }) => {
            const isActive = activePath === href
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '0.5625rem 0.625rem', borderRadius: 7,
                fontSize: '0.9rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--navy)' : 'rgba(255,255,255,0.55)',
                backgroundColor: isActive ? 'var(--gold-light)' : 'transparent',
                transition: 'all 0.15s', textDecoration: 'none',
              }}>
                <Icon size={17} style={{ opacity: isActive ? 1 : 0.6 }} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout */}
      <div style={{ marginTop: 'auto', padding: '0.875rem 1rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <SidebarLogout />
      </div>
    </aside>
  )
}
