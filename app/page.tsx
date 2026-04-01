import Link from 'next/link'
import { redirect } from 'next/navigation'
import { readJobs, getUnreadLeadCount, getLastIncomingLeadDate } from '@/lib/jobs'
import { readSettings } from '@/lib/settings'
import { getTodayAuditCount } from '@/lib/audit'
import { MessageSquare, ClipboardCheck, CheckCircle, Send, Inbox } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import JobPipeline from '@/components/JobPipeline'
import InstallPrompt from '@/components/InstallPrompt'
import WelcomeCard from '@/components/WelcomeCard'
import { Suspense } from 'react'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const settings = await readSettings()

  if (!settings.onboardingComplete) {
    redirect('/onboarding')
  }

  const params = await searchParams
  const showWelcome = params.welcome === '1'

  const [allJobs, unreadCount, lastLeadDate] = await Promise.all([
    readJobs(),
    getUnreadLeadCount(),
    getLastIncomingLeadDate(),
  ])

  // Today stats
  const todayStr = new Date().toISOString().slice(0, 10)
  const jobsToday = allJobs.filter((j) => j.status === 'completed' && j.createdAt.startsWith(todayStr))
  const revenueToday = jobsToday.reduce((sum, j) => sum + (j.price ?? 0), 0)
  const leadsToday = allJobs.filter((j) => j.status === 'lead' && j.createdAt.startsWith(todayStr)).length
  const showTodayStrip = jobsToday.length > 0 || leadsToday > 0 || revenueToday > 0

  // Webhook status
  const siteConnected = lastLeadDate !== null

  // Date string
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activePath="/" />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{
          backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)',
          height: 58, padding: '0 1.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h1 style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800, fontSize: '1.375rem', color: 'var(--navy)' }}>
            Dashboard
          </h1>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: '0.8rem', fontWeight: 600, padding: '4px 10px', borderRadius: 20,
            backgroundColor: siteConnected ? 'var(--green-bg)' : 'var(--amber-bg)',
            color: siteConnected ? 'var(--green)' : 'var(--amber)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: siteConnected ? 'var(--green)' : 'var(--amber)',
            }} />
            {siteConnected ? 'Site connected' : 'Site not connected'}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem 1.75rem', maxWidth: 900 }}>

          {/* Welcome Card */}
          {showWelcome && <WelcomeCard />}

          {/* Onboarding Skipped Banner */}
          {settings.onboardingSkipped && (
            <Link href="/onboarding" style={{
              display: 'block', borderRadius: 'var(--r-lg)',
              padding: '0.75rem 1.125rem', marginBottom: '1.375rem',
              backgroundColor: 'var(--amber-bg)', border: '1px solid rgba(146,64,14,0.12)',
              textDecoration: 'none', fontSize: '0.8125rem', color: 'var(--amber)',
            }}>
              Your setup isn&apos;t complete — AI responses may be inaccurate.{' '}
              <span style={{ fontWeight: 700, textDecoration: 'underline' }}>Finish setup →</span>
            </Link>
          )}

          {/* SECTION B — Today Strip */}
          {showTodayStrip && (
            <div style={{
              backgroundColor: 'var(--navy)', borderRadius: 'var(--r-lg)',
              padding: '1.125rem 1.375rem', marginBottom: '1.375rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '1rem',
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>TODAY</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{dateStr}</div>
              </div>
              <div style={{ display: 'flex', gap: '1.75rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800, fontSize: '1.875rem', lineHeight: 1, color: '#FFFFFF' }}>{jobsToday.length}</div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Jobs</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800, fontSize: '1.875rem', lineHeight: 1, color: 'var(--gold-light)' }}>${revenueToday}</div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Revenue</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800, fontSize: '1.875rem', lineHeight: 1, color: '#93C5FD' }}>{leadsToday}</div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Leads</div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION C — Tools Grid */}
          <div style={{ fontSize: '1rem', fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)', marginBottom: '0.75rem' }}>
            TOOLS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.5rem' }}>
            {/* Card 1 — New Lead (dark) */}
            <Link href="/lead" style={{
              backgroundColor: 'var(--navy)', border: '1px solid var(--navy)', borderRadius: 'var(--r-lg)',
              padding: '1.125rem', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              transition: 'all 0.18s', display: 'flex', flexDirection: 'column', gap: '0.625rem',
              position: 'relative', overflow: 'hidden', textDecoration: 'none',
            }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'rgba(255,255,255,0.3)', fontSize: '1.1rem' }}>→</span>
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '0.875rem', right: '2rem', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: '0.625rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>{unreadCount}</span>
              )}
              <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MessageSquare size={20} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF' }}>New Lead</span>
              <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Draft a reply to a customer inquiry — ready to send in seconds</span>
            </Link>

            {/* Card 2 — Scope a Job */}
            <Link href="/scope" style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
              padding: '1.125rem', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              transition: 'all 0.18s', display: 'flex', flexDirection: 'column', gap: '0.625rem',
              position: 'relative', overflow: 'hidden', textDecoration: 'none',
            }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--gray)', opacity: 0.3, fontSize: '1.1rem' }}>→</span>
              <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardCheck size={20} color="var(--gold)" />
              </div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--navy)' }}>Scope a Job</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gray)', lineHeight: 1.5 }}>Get a price range to quote a customer on the phone right now</span>
            </Link>

            {/* Card 3 — Job Done */}
            <Link href="/jobdone" style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
              padding: '1.125rem', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              transition: 'all 0.18s', display: 'flex', flexDirection: 'column', gap: '0.625rem',
              position: 'relative', overflow: 'hidden', textDecoration: 'none',
            }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--gray)', opacity: 0.3, fontSize: '1.1rem' }}>→</span>
              <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} color="var(--green)" />
              </div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--navy)' }}>Job Done</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gray)', lineHeight: 1.5 }}>Log a completed job and keep your revenue records</span>
            </Link>

            {/* Card 4 — Send Message */}
            <Link href="/message" style={{
              backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
              padding: '1.125rem', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              transition: 'all 0.18s', display: 'flex', flexDirection: 'column', gap: '0.625rem',
              position: 'relative', overflow: 'hidden', textDecoration: 'none',
            }}>
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--gray)', opacity: 0.3, fontSize: '1.1rem' }}>→</span>
              <div style={{ width: 38, height: 38, borderRadius: 8, backgroundColor: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={20} color="var(--blue)" />
              </div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--navy)' }}>Send Message</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--gray)', lineHeight: 1.5 }}>Follow up or re-engage any past customer</span>
            </Link>
          </div>

          {/* SECTION D — Job Pipeline */}
          <div style={{ fontSize: '1rem', fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray)', marginBottom: '0.75rem' }}>
            JOB PIPELINE
          </div>
          <JobPipeline jobs={allJobs} />

          <InstallPrompt />
        </div>
      </div>
    </div>
  )
}
