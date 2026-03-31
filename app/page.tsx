import Link from 'next/link'
import { readJobs, getUnreadLeadCount } from '@/lib/jobs'
import { getTodayAuditCount } from '@/lib/audit'
import { Job } from '@/lib/types'
import { MessageSquare, ClipboardList, CheckCircle, Send, Settings, Zap } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import JobPipeline from '@/components/JobPipeline'

const DAILY_LIMIT = 50

export default async function HomePage() {
  const [allJobs, unreadCount, todayUsage] = await Promise.all([
    readJobs(),
    getUnreadLeadCount(),
    getTodayAuditCount(),
  ])

  const usagePct = Math.min(100, (todayUsage / DAILY_LIMIT) * 100)
  const usageColor = todayUsage >= DAILY_LIMIT ? '#f87171' : todayUsage >= 40 ? '#fcd34d' : '#b8964a'
  const usageLabel = todayUsage >= DAILY_LIMIT ? 'Daily limit reached' : todayUsage >= 40 ? 'Nearing daily limit' : `${todayUsage} API calls today`

  const tools = [
    { href: '/lead', label: 'New Lead', subtitle: 'Draft a response', Icon: MessageSquare, accent: '#b8964a', badge: unreadCount > 0 ? unreadCount : null },
    { href: '/scope', label: 'Scope a Job', subtitle: 'Get a quote', Icon: ClipboardList, accent: '#b8964a', badge: null },
    { href: '/jobdone', label: 'Job Done', subtitle: 'Log & request review', Icon: CheckCircle, accent: '#4ade80', badge: null },
    { href: '/message', label: 'Send a Message', subtitle: 'Re-engage customers', Icon: Send, accent: '#60a5fa', badge: null },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a2535' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between py-5">
          <div>
            <h1 className="text-3xl font-black tracking-widest leading-none" style={{ color: '#b8964a', fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
              JUNK IT
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#718096' }}>Owner Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/settings" className="p-2 rounded-lg transition-opacity hover:opacity-80" style={{ backgroundColor: 'rgba(184,150,74,0.1)', border: '1px solid rgba(184,150,74,0.25)', color: '#718096' }}>
              <Settings size={17} />
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Tool Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {tools.map(({ href, label, subtitle, Icon, accent, badge }) => (
            <Link key={href} href={href}
              className="flex flex-col items-start p-4 rounded-xl transition-all active:opacity-80 relative"
              style={{ backgroundColor: '#243044', border: '1px solid rgba(184,150,74,0.35)' }}>
              {badge !== null && badge > 0 && (
                <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: '#b8964a', color: '#1a2535', minWidth: '18px', textAlign: 'center' }}>
                  {badge}
                </span>
              )}
              <Icon size={26} style={{ color: accent }} className="mb-3" />
              <span className="font-semibold text-sm leading-tight" style={{ color: '#f5f0e8' }}>{label}</span>
              <span className="text-xs mt-0.5" style={{ color: '#718096' }}>{subtitle}</span>
            </Link>
          ))}
        </div>

        {/* Quick Log - full width */}
        <Link href="/quicklog"
          className="flex items-center gap-3 w-full p-4 rounded-xl mb-5 transition-all active:opacity-80"
          style={{ backgroundColor: '#243044', border: '1px solid rgba(184,150,74,0.25)' }}>
          <Zap size={20} style={{ color: '#fcd34d' }} />
          <div>
            <span className="font-semibold text-sm" style={{ color: '#f5f0e8' }}>Quick Log</span>
            <p className="text-xs" style={{ color: '#718096' }}>Fast job capture, no AI</p>
          </div>
        </Link>

        {/* Usage Indicator */}
        <div className="mb-6 rounded-xl p-3" style={{ backgroundColor: '#243044', border: '1px solid rgba(184,150,74,0.15)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: '#718096' }}>Today&apos;s usage</span>
            <span className="text-xs font-medium" style={{ color: usageColor }}>{usageLabel}</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#1a2535' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${usagePct}%`, backgroundColor: usageColor }} />
          </div>
        </div>

        {/* Job Pipeline */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#718096' }}>
            Jobs
          </h2>
          {allJobs.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#718096' }}>
              No jobs yet — use the tools above to get started
            </p>
          ) : (
            <JobPipeline jobs={allJobs} />
          )}
        </div>
      </div>
    </div>
  )
}
