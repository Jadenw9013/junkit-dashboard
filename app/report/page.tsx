'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Printer, BarChart3 } from 'lucide-react'
import { getReport } from '@/app/actions/report'
import { MonthlyReport } from '@/lib/reports'
import BackButton from '@/components/BackButton'

const serviceLabels: Record<string, string> = {
  'junk-removal': 'Junk Removal',
  'demolition': 'Demolition',
  'trailer-rental': 'Trailer Rental',
  'unknown': 'Other',
}

const statusColors: Record<string, { bg: string; text: string }> = {
  lead: { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
  quoted: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24' },
  completed: { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
  reviewed: { bg: 'rgba(0,0,0,0.15)', text: '#F5C518' },
}

export default function ReportPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadReport(y: number, m: number) {
    setLoading(true)
    const r = await getReport(y, m)
    setReport(r)
    setLoading(false)
  }

  useEffect(() => { loadReport(year, month) }, [year, month])

  function prevMonth() {
    if (month === 1) { setYear(year - 1); setMonth(12) }
    else setMonth(month - 1)
  }

  function nextMonth() {
    if (month === 12) { setYear(year + 1); setMonth(1) }
    else setMonth(month + 1)
  }

  const s = report?.summary

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="mx-auto max-w-[600px] px-4 pb-8">
        <div className="flex items-center justify-between py-5 no-print">
          <div className="flex items-center gap-3">
            <BackButton href="/" />
            <h1 className="text-xl font-bold" style={{ color: '#2D2D2D' }}>Monthly Report</h1>
          </div>
          <button onClick={() => window.print()} className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: '#F5C518' }}>
            <Printer size={18} />
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-center gap-4 mb-6 no-print">
          <button onClick={prevMonth} className="p-2 rounded-lg" style={{ backgroundColor: '#FFFFFF', color: '#6B7280' }}>
            <ChevronLeft size={20} />
          </button>
          <span className="text-lg font-semibold min-w-[180px] text-center" style={{ color: '#2D2D2D' }}>
            {report?.month || 'Loading...'}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg" style={{ backgroundColor: '#FFFFFF', color: '#6B7280' }}>
            <ChevronRight size={20} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: '#F5C518', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: '#6B7280' }}>Generating report...</p>
          </div>
        ) : report && (
          <div className="space-y-6 print-report">
            {/* Print Header */}
            <div className="hidden print-only text-center mb-6">
              <h1 className="text-2xl font-black tracking-widest" style={{ color: '#000' }}>JUNK IT</h1>
              <h2 className="text-lg font-semibold mt-1">Monthly Report — {report.month}</h2>
              <p className="text-sm text-gray-500">Generated {new Date(report.generatedAt).toLocaleString()}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: 'Total Jobs', value: s?.totalJobs ?? 0 },
                { label: 'Total Revenue', value: `$${(s?.totalRevenue ?? 0).toLocaleString()}` },
                { label: 'Avg Job Value', value: `$${(s?.avgJobValue ?? 0).toLocaleString()}` },
                { label: 'New Customers', value: s?.newCustomers ?? 0 },
                { label: 'Leads Received', value: s?.leadsReceived ?? 0 },
                { label: 'Conversion Rate', value: `${s?.conversionRate ?? 0}%` },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.2)' }}>
                  <p className="text-lg font-bold" style={{ color: '#F5C518' }}>{item.value}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{item.label}</p>
                </div>
              ))}
            </div>

            {/* By Service */}
            {report.byService.length > 0 && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.2)' }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#F5C518' }}>By Service</h3>
                {(() => {
                  const maxRev = Math.max(...report.byService.map((s) => s.revenue), 1)
                  return report.byService.map((item) => (
                    <div key={item.service} className="mb-2.5 last:mb-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: '#2D2D2D' }}>{serviceLabels[item.service] || item.service}</span>
                        <span style={{ color: '#6B7280' }}>{item.count} jobs · ${item.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#F7F6F1' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(item.revenue / maxRev) * 100}%`, backgroundColor: '#F5C518' }} />
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

            {/* By City */}
            {report.byCity.length > 0 && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.2)' }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#F5C518' }}>By City</h3>
                {(() => {
                  const maxCount = Math.max(...report.byCity.map((c) => c.count), 1)
                  return report.byCity.map((item) => (
                    <div key={item.city} className="mb-2.5 last:mb-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: '#2D2D2D' }}>{item.city || 'Unknown'}</span>
                        <span style={{ color: '#6B7280' }}>{item.count} jobs · ${item.revenue.toLocaleString()}</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#F7F6F1' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(item.count / maxCount) * 100}%`, backgroundColor: '#E0B115' }} />
                      </div>
                    </div>
                  ))
                })()}
              </div>
            )}

            {/* Top Customers */}
            {report.topCustomers.length > 0 && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.2)' }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#F5C518' }}>Top Customers This Month</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: '#6B7280' }}>
                        <th className="text-left py-2 pr-2">Name</th>
                        <th className="text-left py-2 pr-2">City</th>
                        <th className="text-right py-2 pr-2">Jobs</th>
                        <th className="text-right py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.topCustomers.map((c, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                          <td className="py-2 pr-2" style={{ color: '#2D2D2D' }}>{c.name}</td>
                          <td className="py-2 pr-2" style={{ color: '#6B7280' }}>{c.city}</td>
                          <td className="py-2 pr-2 text-right" style={{ color: '#2D2D2D' }}>{c.jobs}</td>
                          <td className="py-2 text-right" style={{ color: '#4ade80' }}>${c.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Full Job List */}
            {report.jobList.length > 0 && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.2)' }}>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#F5C518' }}>All Jobs</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: '#6B7280' }}>
                        <th className="text-left py-2 pr-2">Date</th>
                        <th className="text-left py-2 pr-2">Customer</th>
                        <th className="text-left py-2 pr-2">City</th>
                        <th className="text-left py-2 pr-2">Service</th>
                        <th className="text-right py-2 pr-2">Price</th>
                        <th className="text-right py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.jobList.map((j, i) => {
                        const sc = statusColors[j.status] || statusColors.lead
                        return (
                          <tr key={i} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.1)', backgroundColor: i % 2 === 1 ? 'rgba(0,0,0,0.03)' : 'transparent' }}>
                            <td className="py-2 pr-2" style={{ color: '#2D2D2D' }}>{j.date}</td>
                            <td className="py-2 pr-2" style={{ color: '#2D2D2D' }}>{j.customerName}</td>
                            <td className="py-2 pr-2" style={{ color: '#6B7280' }}>{j.city}</td>
                            <td className="py-2 pr-2" style={{ color: '#E0B115' }}>{serviceLabels[j.service] || j.service}</td>
                            <td className="py-2 pr-2 text-right" style={{ color: '#4ade80' }}>{j.price > 0 ? `$${j.price.toLocaleString()}` : '—'}</td>
                            <td className="py-2 text-right">
                              <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>{j.status}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {report.summary.totalJobs === 0 && (
              <div className="flex flex-col items-center text-center py-12">
                <BarChart3 size={40} style={{ color: '#6B7280' }} className="mb-3" />
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#2D2D2D' }}>No jobs logged this month</h3>
                <p className="text-xs max-w-[260px] mb-4" style={{ color: '#6B7280' }}>
                  Jobs will appear here once you start logging completed work. Your data is cumulative — past months stay available forever.
                </p>
                <a href="/jobdone" className="px-5 py-2.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
                  Log a job →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
