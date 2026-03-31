import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readJobs, getUnreadLeadCount } from '@/lib/jobs'
import { readSettings } from '@/lib/settings'
import { getTodayAuditCount } from '@/lib/audit'
import { MessageSquare, ClipboardList, CheckCircle, Send, Settings, Zap, Users, BarChart3, Inbox, DollarSign, Briefcase, TrendingUp } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import JobPipeline from '@/components/JobPipeline'
import InstallPrompt from '@/components/InstallPrompt'

const DAILY_LIMIT = 50

export default async function HomePage() {
  const settings = await readSettings()

  if (!settings.onboardingComplete) {
    redirect('/onboarding')
  }

  const [allJobs, unreadCount, todayUsage] = await Promise.all([
    readJobs(),
    getUnreadLeadCount(),
    getTodayAuditCount(),
  ])

  const usagePct = Math.min(100, (todayUsage / DAILY_LIMIT) * 100)
  const usageColor = todayUsage >= DAILY_LIMIT ? '#ef4444' : todayUsage >= 40 ? '#f59e0b' : '#F5C518'
  const usageLabel = todayUsage >= DAILY_LIMIT ? 'Daily limit reached' : todayUsage >= 40 ? 'Nearing daily limit' : `${todayUsage} API calls today`

  // Today at a Glance
  const todayStr = new Date().toISOString().slice(0, 10)
  const jobsToday = allJobs.filter(
    (j) => j.status === 'completed' && j.createdAt.startsWith(todayStr)
  )
  const revenueToday = jobsToday.reduce((sum, j) => sum + (j.price ?? 0), 0)
  const leadsToday = allJobs.filter(
    (j) => j.status === 'lead' && j.createdAt.startsWith(todayStr)
  ).length
  const showTodayGlance = jobsToday.length > 0 || leadsToday > 0

  const tools = [
    { href: '/lead', label: 'New Lead', subtitle: 'Draft a response', Icon: MessageSquare, accent: '#F5C518', badge: unreadCount > 0 ? unreadCount : null },
    { href: '/scope', label: 'Scope a Job', subtitle: 'Get a quote', Icon: ClipboardList, accent: '#F5C518', badge: null },
    { href: '/jobdone', label: 'Job Done', subtitle: 'Log & request review', Icon: CheckCircle, accent: '#22c55e', badge: null },
    { href: '/message', label: 'Send a Message', subtitle: 'Re-engage customers', Icon: Send, accent: '#3b82f6', badge: null },
  ]

  const headerLinks = [
    { href: '/customers', label: 'Customers', Icon: Users },
    { href: '/report', label: 'Report', Icon: BarChart3 },
    { href: '/settings', label: 'Settings', Icon: Settings },
  ]

  // Pipeline empty state check
  const pipelineEmpty = allJobs.length === 0

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between py-5">
          <div>
            <h1 className="text-3xl font-black tracking-widest leading-none" style={{ color: '#2D2D2D', fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
              JUNK<span style={{ color: '#F5C518' }}>▲</span>IT
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Owner Dashboard</p>
          </div>
          <div className="flex items-center gap-1.5">
            {headerLinks.map(({ href, label, Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-2 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', color: '#6B7280' }}
                title={label}>
                <Icon size={17} />
                <span className="hidden sm:inline text-xs font-medium">{label}</span>
              </Link>
            ))}
            <LogoutButton />
          </div>
        </div>

        {/* Tool Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {tools.map(({ href, label, subtitle, Icon, accent, badge }) => (
            <Link key={href} href={href}
              className="flex flex-col items-start p-4 rounded-xl transition-all active:opacity-80 relative"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
              {badge !== null && badge > 0 && (
                <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: '#F5C518', color: '#2D2D2D', minWidth: '18px', textAlign: 'center' }}>
                  {badge}
                </span>
              )}
              <Icon size={26} style={{ color: accent }} className="mb-3" />
              <span className="font-semibold text-sm leading-tight" style={{ color: '#2D2D2D' }}>{label}</span>
              <span className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{subtitle}</span>
            </Link>
          ))}
        </div>

        {/* Quick Log - full width */}
        <Link href="/quicklog"
          className="flex items-center gap-3 w-full p-4 rounded-xl mb-5 transition-all active:opacity-80"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
          <Zap size={20} style={{ color: '#F5C518' }} />
          <div>
            <span className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>Quick Log</span>
            <p className="text-xs" style={{ color: '#6B7280' }}>Fast job capture, no AI</p>
          </div>
        </Link>

        {/* Today at a Glance */}
        {showTodayGlance && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
              <Briefcase size={18} className="mx-auto mb-1" style={{ color: '#22c55e' }} />
              <p className="text-lg font-bold" style={{ color: '#2D2D2D' }}>{jobsToday.length}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Jobs Today</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
              <DollarSign size={18} className="mx-auto mb-1" style={{ color: '#F5C518' }} />
              <p className="text-lg font-bold" style={{ color: '#2D2D2D' }}>${revenueToday}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Revenue</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
              <TrendingUp size={18} className="mx-auto mb-1" style={{ color: '#3b82f6' }} />
              <p className="text-lg font-bold" style={{ color: '#2D2D2D' }}>{leadsToday}</p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>Leads Today</p>
            </div>
          </div>
        )}

        {/* Usage Indicator */}
        <div className="mb-6 rounded-xl p-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: '#6B7280' }}>Today&apos;s usage</span>
            <span className="text-xs font-medium" style={{ color: usageColor }}>{usageLabel}</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#F0EFE9' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${usagePct}%`, backgroundColor: usageColor }} />
          </div>
        </div>

        {/* Job Pipeline */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
            Jobs
          </h2>
          {pipelineEmpty ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Inbox size={40} style={{ color: '#9CA3AF' }} className="mb-3" />
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#2D2D2D' }}>Pipeline is empty</h3>
              <p className="text-xs max-w-[240px]" style={{ color: '#6B7280' }}>
                Use New Lead to capture inquiries or Quick Log to add a job instantly.
              </p>
            </div>
          ) : (
            <JobPipeline jobs={allJobs} />
          )}
        </div>

        <InstallPrompt />
      </div>
    </div>
  )
}
