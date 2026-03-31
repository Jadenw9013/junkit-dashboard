'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { generateReEngagement, generateFollowUp, generateCustomMessage } from '@/app/actions/message'
import BackButton from '@/components/BackButton'
import FallbackBanner from '@/components/FallbackBanner'
import FeedbackWidget from '@/components/FeedbackWidget'

type Tab = 're-engagement' | 'follow-up' | 'custom'

const inputStyle = {
  backgroundColor: '#243044',
  border: '1px solid rgba(184,150,74,0.3)',
  color: '#f5f0e8',
}

export default function MessagePage() {
  const [activeTab, setActiveTab] = useState<Tab>('re-engagement')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ text: string; usedFallback?: boolean } | null>(null)
  const [copied, setCopied] = useState(false)

  const [reForm, setReForm] = useState({ customerName: '', pastService: 'junk-removal', monthsSince: '3-6', seasonalContext: '' })
  const [fuForm, setFuForm] = useState({ customerName: '', quotedAmount: '', daysSince: '3-5' })
  const [customSituation, setCustomSituation] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setResult(null)
    try {
      let res: { text: string; usedFallback?: boolean }
      if (activeTab === 're-engagement') res = await generateReEngagement(reForm)
      else if (activeTab === 'follow-up') res = await generateFollowUp(fuForm)
      else res = await generateCustomMessage({ situation: customSituation })
      setResult(res)
    } catch { toast.error('Failed to generate message') }
    setLoading(false)
  }

  const canGenerate =
    (activeTab === 're-engagement' && reForm.customerName.trim()) ||
    (activeTab === 'follow-up' && fuForm.customerName.trim()) ||
    (activeTab === 'custom' && customSituation.trim())

  const tabs: { id: Tab; label: string }[] = [
    { id: 're-engagement', label: 'Re-engagement' },
    { id: 'follow-up', label: 'Follow-up' },
    { id: 'custom', label: 'Custom' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a2535' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        <div className="flex items-center gap-3 py-5">
          <BackButton href="/" />
          <h1 className="text-xl font-bold" style={{ color: '#f5f0e8' }}>Send a Message</h1>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl p-1 mb-5" style={{ backgroundColor: '#243044', border: '1px solid rgba(184,150,74,0.2)' }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setResult(null) }}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ backgroundColor: activeTab === tab.id ? '#b8964a' : 'transparent', color: activeTab === tab.id ? '#1a2535' : '#718096' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 're-engagement' && (
          <div className="space-y-3">
            <input type="text" placeholder="Customer name" value={reForm.customerName}
              onChange={(e) => setReForm({ ...reForm, customerName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            <select value={reForm.pastService} onChange={(e) => setReForm({ ...reForm, pastService: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
              <option value="junk-removal">Junk Removal</option>
              <option value="demolition">Light Demolition</option>
              <option value="trailer-rental">Trailer Rental</option>
            </select>
            <select value={reForm.monthsSince} onChange={(e) => setReForm({ ...reForm, monthsSince: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
              <option value="1-3">1–3 months ago</option>
              <option value="3-6">3–6 months ago</option>
              <option value="6-12">6–12 months ago</option>
              <option value="12+">12+ months ago</option>
            </select>
            <input type="text" placeholder="Seasonal context (optional, e.g. spring cleaning season)"
              value={reForm.seasonalContext} onChange={(e) => setReForm({ ...reForm, seasonalContext: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
          </div>
        )}

        {activeTab === 'follow-up' && (
          <div className="space-y-3">
            <input type="text" placeholder="Customer name" value={fuForm.customerName}
              onChange={(e) => setFuForm({ ...fuForm, customerName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            <input type="text" placeholder="What they were quoted (e.g. $280–$350)" value={fuForm.quotedAmount}
              onChange={(e) => setFuForm({ ...fuForm, quotedAmount: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            <select value={fuForm.daysSince} onChange={(e) => setFuForm({ ...fuForm, daysSince: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
              <option value="1-2">1–2 days ago</option>
              <option value="3-5">3–5 days ago</option>
              <option value="1 week">About a week ago</option>
              <option value="2+ weeks">2+ weeks ago</option>
            </select>
          </div>
        )}

        {activeTab === 'custom' && (
          <textarea rows={5} placeholder="Describe the situation — who is the customer and what do you want to say?"
            value={customSituation} onChange={(e) => setCustomSituation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none" style={inputStyle} />
        )}

        <button onClick={handleGenerate} disabled={loading || !canGenerate}
          className="w-full mt-4 py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#b8964a', color: '#1a2535' }}>
          {loading ? 'Generating...' : 'Generate Message'}
        </button>

        {result && (
          <div className="mt-4 space-y-3">
            {result.usedFallback && <FallbackBanner />}
            <div className="rounded-xl p-4" style={{ backgroundColor: '#243044', border: '1px solid rgba(184,150,74,0.4)' }}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm leading-relaxed flex-1" style={{ color: '#f5f0e8' }}>{result.text}</p>
                <button onClick={async () => { await navigator.clipboard.writeText(result.text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(184,150,74,0.1)', color: '#b8964a' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: '#718096' }}>{result.text.length} characters</p>
            </div>
            <FeedbackWidget tool="message" outputSummary={result.text.slice(0, 100)} />
          </div>
        )}
      </div>
    </div>
  )
}
