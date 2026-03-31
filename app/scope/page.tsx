'use client'

import { useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { generateQuote, saveQuotedJob, ScopeInput, QuoteResult } from '@/app/actions/scope'
import { ServiceType } from '@/lib/types'
import BackButton from '@/components/BackButton'
import FallbackBanner from '@/components/FallbackBanner'
import FeedbackWidget from '@/components/FeedbackWidget'
import CopyButton from '@/components/CopyButton'

function ToggleButtons({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {[{ label: 'No', val: false }, { label: 'Yes', val: true }].map(({ label, val }) => (
        <button key={label} type="button" onClick={() => onChange(val)}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            backgroundColor: value === val ? (val ? 'rgba(184,150,74,0.25)' : '#243044') : '#1a2535',
            border: value === val ? `1px solid ${val ? '#b8964a' : 'rgba(184,150,74,0.4)'}` : '1px solid rgba(184,150,74,0.15)',
            color: value === val ? '#f5f0e8' : '#718096',
          }}>
          {label}
        </button>
      ))}
    </div>
  )
}

const inputStyle = {
  backgroundColor: '#243044',
  border: '1px solid rgba(184,150,74,0.3)',
  color: '#f5f0e8',
}

export default function ScopePage() {
  const [form, setForm] = useState<ScopeInput>({
    customerName: '', city: '', service: 'junk-removal', description: '',
    appliances: false, difficultAccess: false, demoRequired: false,
  })
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<(QuoteResult & { usedFallback?: boolean; error?: string }) | null>(null)
  const [saving, setSaving] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)

  async function handleGenerate() {
    if (!form.description.trim()) return
    setLoading(true)
    setRateLimited(false)
    try {
      const result = await generateQuote(form)
      if (result.error === 'rate_limited') {
        setRateLimited(true)
        setQuote(null)
      } else {
        setQuote(result)
      }
    } catch { toast.error('Something went wrong') }
    setLoading(false)
  }

  async function handleSave(saveAs: 'lead' | 'quoted') {
    if (!quote) return
    setSaving(true)
    try {
      await saveQuotedJob(form, quote, saveAs)
      toast.success(saveAs === 'lead' ? 'Saved as lead' : 'Saved as quoted job')
    } catch { toast.error('Failed to save job') }
    setSaving(false)
  }

  const confidenceColor = { high: '#4ade80', medium: '#fcd34d', low: '#f87171' }
  const truckLabels = { quarter: 'Quarter Truck', half: 'Half Truck', full: 'Full Truck' }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a2535' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        <div className="flex items-center gap-3 py-5">
          <BackButton href="/" />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#f5f0e8' }}>Scope a Job</h1>
            <p className="text-xs" style={{ color: '#718096' }}>Fill in what the customer told you — get a quote in seconds</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <input type="text" placeholder="Customer name" value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            <input type="text" placeholder="City" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value as ServiceType })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
              <option value="junk-removal">Junk Removal</option>
              <option value="demolition">Light Demolition</option>
              <option value="trailer-rental">Trailer Rental</option>
            </select>
            <textarea rows={4} placeholder="What needs to go? Describe size and items" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none" style={inputStyle} />
          </div>

          <div className="space-y-3">
            {[
              { key: 'appliances' as const, label: 'Appliances included?' },
              { key: 'difficultAccess' as const, label: 'Difficult access?', sub: 'stairs, narrow gate, long carry distance' },
              { key: 'demoRequired' as const, label: 'Demo required?' },
            ].map(({ key, label, sub }) => (
              <div key={key}>
                <label className="text-sm font-medium mb-1 block" style={{ color: '#f5f0e8' }}>{label}</label>
                {sub && <p className="text-xs mb-2" style={{ color: '#718096' }}>{sub}</p>}
                <ToggleButtons value={form[key]} onChange={(v) => setForm({ ...form, [key]: v })} />
              </div>
            ))}
          </div>

          <button onClick={handleGenerate} disabled={loading || !form.description.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#b8964a', color: '#1a2535' }}>
            {loading ? 'Generating Quote...' : 'Generate Quote'}
          </button>
        </div>

        {rateLimited && (
          <div className="mt-4 rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <Clock size={20} style={{ color: '#fbbf24' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#fbbf24' }}>Too many requests</p>
              <p className="text-xs" style={{ color: '#718096' }}>Try again in a few minutes.</p>
            </div>
          </div>
        )}

        {quote && (
          <div className="mt-6 space-y-4">
            {quote.usedFallback && <FallbackBanner />}
            <div className="rounded-xl p-5" style={{ backgroundColor: '#243044', border: '1px solid rgba(184,150,74,0.4)' }}>
              <div className="text-center mb-4">
                <span className="text-4xl font-black" style={{ color: '#b8964a', fontFamily: 'var(--font-barlow-condensed, sans-serif)' }}>
                  ${quote.priceMin} – ${quote.priceMax}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(184,150,74,0.15)', color: '#d4ae6a' }}>
                  {truckLabels[quote.truckSize]}
                </span>
                <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'rgba(184,150,74,0.1)', color: '#718096' }}>
                  {quote.timeEstimate}
                </span>
                <span className="text-xs px-3 py-1 rounded-full font-medium capitalize" style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: confidenceColor[quote.confidence] }}>
                  {quote.confidence} confidence
                </span>
              </div>
              <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: '#1a2535', border: '1px solid rgba(184,150,74,0.2)' }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-relaxed italic flex-1" style={{ color: '#f5f0e8' }}>
                    &ldquo;{quote.verbalQuote}&rdquo;
                  </p>
                  <CopyButton text={quote.verbalQuote}
                    className="p-1.5 shrink-0 mt-0.5"
                    style={{ backgroundColor: 'rgba(184,150,74,0.1)', color: '#b8964a' }} />
                </div>
                <p className="text-xs mt-1" style={{ color: '#718096' }}>Read this aloud on the phone</p>
              </div>
              {quote.flags && quote.flags.length > 0 && (
                <div className="space-y-1.5">
                  {quote.flags.map((flag, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <AlertTriangle size={13} style={{ color: '#fcd34d', flexShrink: 0 }} />
                      <span className="text-xs" style={{ color: '#fcd34d' }}>{flag}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <FeedbackWidget tool="scope" outputSummary={quote.verbalQuote.slice(0, 100)} />

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleSave('lead')} disabled={saving}
                className="py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
                {saving ? 'Saving...' : 'Save as Lead'}
              </button>
              <button onClick={() => handleSave('quoted')} disabled={saving}
                className="py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                style={{ backgroundColor: 'rgba(184,150,74,0.1)', border: '1px solid rgba(184,150,74,0.3)', color: '#b8964a' }}>
                {saving ? 'Saving...' : 'Save as Quoted'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
