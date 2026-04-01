import Link from 'next/link'
import { MessageSquare, ClipboardList, CheckCircle, Send, Zap, Settings, Users, BarChart3, ArrowLeft, ExternalLink } from 'lucide-react'

const tools = [
  {
    Icon: MessageSquare, label: 'New Lead', color: '#F5C518',
    desc: 'When someone contacts you through your website or by phone, open New Lead and paste their info. The AI writes a professional SMS and email response for you to send.',
  },
  {
    Icon: ClipboardList, label: 'Scope a Job', color: '#F5C518',
    desc: 'Got the job details? Enter what needs to be hauled. The AI gives you a price range, truck size estimate, and a verbal quote you can read to the customer.',
  },
  {
    Icon: CheckCircle, label: 'Job Done', color: '#22c55e',
    desc: 'After you finish a job, log it here with the customer name, what you charged, and any notes. This feeds your monthly reports and tracks revenue.',
  },
  {
    Icon: Send, label: 'Send a Message', color: '#3b82f6',
    desc: 'Haven\'t heard from a past customer in a while? Pick them from your list and the AI writes a casual check-in text to keep the relationship warm.',
  },
  {
    Icon: Zap, label: 'Quick Log', color: '#F5C518',
    desc: 'No AI needed — just log a customer name, service, and city. Good for when you\'re in a rush and want to get stuff into the system fast.',
  },
]

const pages = [
  { Icon: Users, label: 'Customers', desc: 'See everyone you\'ve worked with, their total spend, and job history.' },
  { Icon: BarChart3, label: 'Report', desc: 'Monthly breakdown of jobs, revenue, top cities, and conversion rates.' },
  { Icon: Settings, label: 'Settings', desc: 'Your business info, pricing ranges, service area, and AI response style.' },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="mx-auto max-w-[500px] px-4 pb-8">
        <div className="flex items-center gap-3 py-5">
          <Link href="/" className="p-2 rounded-lg" style={{ backgroundColor: '#FFFFFF', color: '#6B7280', border: '1px solid rgba(0,0,0,0.08)' }}>
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: '#2D2D2D' }}>Help</h1>
        </div>

        <div className="space-y-6">
          {/* Tools */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#F5C518' }}>AI Tools</h2>
            <div className="space-y-2">
              {tools.map((t) => (
                <div key={t.label} className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <t.Icon size={18} style={{ color: t.color }} />
                    <span className="text-sm font-semibold" style={{ color: '#2D2D2D' }}>{t.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#6B7280' }}>{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pages */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#F5C518' }}>Pages</h2>
            <div className="space-y-2">
              {pages.map((p) => (
                <div key={p.label} className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <p.Icon size={16} style={{ color: '#6B7280' }} />
                    <span className="text-sm font-semibold" style={{ color: '#2D2D2D' }}>{p.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#F5C518' }}>Common Questions</h2>
            <div className="space-y-2">
              {[
                { q: 'Why does the AI get prices wrong?', a: 'Go to Settings → Pricing and make sure your ranges are up to date. The AI uses whatever you\'ve entered there.' },
                { q: 'How do leads get into the dashboard?', a: 'Your website form sends them here automatically via webhook. You can also enter them manually with New Lead.' },
                { q: 'Can I reset my password?', a: 'Yes — on the login page, tap "Forgot password?" and enter your recovery email.' },
                { q: 'Is my data private?', a: 'Yes. This dashboard is password-protected and not indexed by search engines. Only you can access it.' },
              ].map((faq) => (
                <div key={faq.q} className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#2D2D2D' }}>{faq.q}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="text-center pt-4">
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              Need more help?{' '}
              <a href="mailto:support@junk-it.com" className="underline" style={{ color: '#6B7280' }}>
                Email support <ExternalLink size={10} className="inline" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
