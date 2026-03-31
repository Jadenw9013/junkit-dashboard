'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Download, RefreshCw, Eye, LogOut } from 'lucide-react'
import { getAdminData, getPromptPreview } from '@/app/actions/admin'
import { AuditEntry, FeedbackEntry } from '@/lib/types'

export default function AdminDashboard() {
  const router = useRouter()
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([])
  const [health, setHealth] = useState<Awaited<ReturnType<typeof getAdminData>>['health'] | null>(null)
  const [loading, setLoading] = useState(true)

  // Prompt inspector
  const [selectedTool, setSelectedTool] = useState('lead')
  const [promptText, setPromptText] = useState('')
  const [promptLoading, setPromptLoading] = useState(false)

  async function loadData() {
    setLoading(true)
    const data = await getAdminData()
    setAuditEntries(data.auditEntries)
    setFeedbackEntries(data.feedbackEntries)
    setHealth(data.health)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function handlePreviewPrompt() {
    setPromptLoading(true)
    const text = await getPromptPreview(selectedTool)
    setPromptText(text)
    setPromptLoading(false)
  }

  async function handleLogout() {
    await fetch('/api/admin-auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  function exportFile(file: string) {
    window.open(`/api/admin/export?file=${file}`, '_blank')
  }

  const goodFeedback = feedbackEntries.filter((f) => f.rating === 'good').length
  const badFeedback = feedbackEntries.filter((f) => f.rating === 'bad').length
  const satisfaction = feedbackEntries.length > 0
    ? Math.round((goodFeedback / feedbackEntries.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
        <p className="text-gray-500">Loading admin data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Junk It — Developer Admin</h1>
            <p className="text-sm text-gray-500">Phase 4 Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/webhook-setup"
              className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
              Webhook Setup
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Panel 1 — Audit Log */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Audit Log</h2>
              <button onClick={() => exportFile('audit')} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Download size={14} /> Export JSON
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-2 pr-2">Timestamp</th>
                    <th className="text-left py-2 pr-2">Tool</th>
                    <th className="text-left py-2 pr-2">Action</th>
                    <th className="text-left py-2 pr-2">Input</th>
                    <th className="text-right py-2 pr-2">Duration</th>
                    <th className="text-right py-2 pr-2">Tokens</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEntries.length === 0 ? (
                    <tr><td colSpan={7} className="py-6 text-center text-gray-400">No audit entries yet</td></tr>
                  ) : auditEntries.map((e) => (
                    <tr key={e.id} className={`border-b ${!e.success ? 'bg-red-50' : ''}`}>
                      <td className="py-1.5 pr-2 text-gray-500">{new Date(e.timestamp).toLocaleString()}</td>
                      <td className="py-1.5 pr-2 font-medium">{e.tool}</td>
                      <td className="py-1.5 pr-2">{e.action}</td>
                      <td className="py-1.5 pr-2 text-gray-500 max-w-[200px] truncate">{e.inputSummary?.slice(0, 60)}</td>
                      <td className="py-1.5 pr-2 text-right text-gray-500">{e.durationMs ? `${e.durationMs}ms` : '—'}</td>
                      <td className="py-1.5 pr-2 text-right text-gray-500">{e.tokensUsed ?? '—'}</td>
                      <td className="py-1.5 text-center">{e.success ? '✓' : '✗'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel 2 — Feedback */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Feedback Log</h2>
              <button onClick={() => exportFile('feedback')} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <Download size={14} /> Export
              </button>
            </div>
            <div className="flex gap-3 mb-3">
              <span className="text-sm text-green-600 font-medium">{goodFeedback} 👍</span>
              <span className="text-sm text-red-600 font-medium">{badFeedback} 👎</span>
              <span className="text-sm text-gray-500">{satisfaction}% satisfaction</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Tool</th>
                    <th className="text-center py-2">Rating</th>
                    <th className="text-left py-2">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackEntries.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-400">No feedback yet</td></tr>
                  ) : feedbackEntries.slice().reverse().map((f) => (
                    <tr key={f.id} className="border-b">
                      <td className="py-1.5 text-gray-500">{new Date(f.timestamp).toLocaleDateString()}</td>
                      <td className="py-1.5">{f.tool}</td>
                      <td className="py-1.5 text-center">{f.rating === 'good' ? '👍' : '👎'}</td>
                      <td className="py-1.5 text-gray-500">{f.issue || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel 3 — System Health */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">System Health</h2>
              <button onClick={loadData} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            {health && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Jobs</span>
                  <span className="font-medium">{health.jobsCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Customers</span>
                  <span className="font-medium">{health.customersCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Audit entries</span>
                  <span className="font-medium">{health.auditCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Feedback</span>
                  <span className="font-medium">{health.feedbackCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Sessions</span>
                  <span className="font-medium">{health.sessionsCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Settings v{health.settingsVersion}</span>
                  <span className="font-medium text-xs">{health.settingsUpdatedAt ? new Date(health.settingsUpdatedAt).toLocaleDateString() : 'never'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 col-span-2">
                  <span className="text-gray-500">ANTHROPIC_API_KEY</span>
                  <span className={`font-medium ${health.anthropicKeySet ? 'text-green-600' : 'text-red-600'}`}>
                    {health.anthropicKeySet ? `${health.anthropicKeyPreview} ✓` : 'missing ✗'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">DASHBOARD_PASSWORD</span>
                  <span className={`font-medium ${health.dashboardPasswordSet ? 'text-green-600' : 'text-red-600'}`}>
                    {health.dashboardPasswordSet ? 'set ✓' : 'missing ✗'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">DEVELOPER_SECRET</span>
                  <span className={`font-medium ${health.developerSecretSet ? 'text-green-600' : 'text-red-600'}`}>
                    {health.developerSecretSet ? 'set ✓' : 'missing ✗'}
                  </span>
                </div>
                <div className="col-span-2 mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">Storage Backend</span>
                    <span className={`font-semibold text-sm px-2 py-0.5 rounded ${health.storageBackend === 'kv' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {health.storageBackend === 'kv' ? 'Redis' : 'Local files (dev only)'}
                    </span>
                  </div>
                  {health.storageBackend === 'file' && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-800">⚠ Data will not persist on Vercel. Add KV storage before deploying to production.</p>
                      <a href="https://vercel.com/docs/storage/vercel-kv/quickstart" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        How to add Vercel KV →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Panel 4 — Prompt Inspector */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 col-span-1 lg:col-span-2">
            <h2 className="font-semibold text-gray-800 mb-3">Prompt Inspector</h2>
            <div className="flex items-center gap-2 mb-3">
              <select
                value={selectedTool}
                onChange={(e) => { setSelectedTool(e.target.value); setPromptText('') }}
                className="px-3 py-2 rounded-lg text-sm border border-gray-300"
                style={{ backgroundColor: '#fff', color: '#1f2937' }}
              >
                <option value="lead">Lead</option>
                <option value="scope">Scope</option>
                <option value="jobdone">Job Done</option>
                <option value="message">Message</option>
              </select>
              <button onClick={handlePreviewPrompt} disabled={promptLoading}
                className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50">
                <Eye size={14} /> {promptLoading ? 'Loading...' : 'Preview Prompt'}
              </button>
            </div>
            {promptText && (
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs whitespace-pre-wrap font-mono max-h-[400px] overflow-y-auto" style={{ color: '#374151' }}>
                {promptText}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
