'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { toast } from 'sonner'
import { generateQuote, saveQuotedJob, ScopeInput, QuoteResult } from '@/app/actions/scope'
import { ServiceType } from '@/lib/types'
import FallbackBanner from '@/components/FallbackBanner'
import AIDraftNotice from '@/components/AIDraftNotice'
import CopyButton from '@/components/CopyButton'

const services: { value: ServiceType; label: string }[] = [
  { value: 'junk-removal', label: 'Junk Removal' },
  { value: 'demolition', label: 'Light Demo' },
  { value: 'trailer-rental', label: 'Trailer Rental' },
]

function ToggleGroup({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string | boolean
  onChange: (v: string | boolean) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map((opt) => {
        const isActive = value === opt.value || value === (opt.value === 'true')
        return (
          <button key={opt.value} type="button"
            onClick={() => onChange(typeof value === 'boolean' ? opt.value === 'true' : opt.value)}
            style={{
              padding: '0.4375rem 0.9375rem', borderRadius: 7,
              fontSize: '0.8125rem', fontWeight: 600,
              border: isActive ? '1.5px solid var(--navy)' : '1.5px solid var(--border-med)',
              backgroundColor: isActive ? 'var(--navy)' : 'var(--surface)',
              color: isActive ? '#FFFFFF' : 'var(--gray)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
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

  const confidenceColors: Record<string, { color: string; bg: string }> = {
    high: { color: 'var(--green)', bg: 'var(--green-bg)' },
    medium: { color: 'var(--gold)', bg: 'var(--gold-pale)' },
    low: { color: 'var(--red)', bg: 'var(--red-bg)' },
  }
  const truckLabels: Record<string, string> = { quarter: 'Quarter Truck', half: 'Half Truck', full: 'Full Truck' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)' }}>
        {/* Topbar */}
        <div style={{
          backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)',
          height: 58, padding: '0 1.75rem',
          display: 'flex', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h1 style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800, fontSize: '1.375rem', color: 'var(--navy)' }}>
            Scope a Job
          </h1>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem 1.75rem', maxWidth: 900 }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '1.25rem' }}>
            Fill in what the customer told you — get a quote to read on the phone in seconds.
          </p>

          {/* Input Card */}
          <div style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)',
            padding: '1.5rem', marginBottom: '1rem',
          }}>
            {/* Name + City row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.125rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.375rem' }}>Customer name</label>
                <input type="text" placeholder="e.g. John Smith" value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--r)',
                    border: '1.5px solid var(--border-med)', backgroundColor: 'var(--surface)',
                    fontSize: '0.9375rem', color: 'var(--navy)', outline: 'none',
                  }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.375rem' }}>City</label>
                <input type="text" placeholder="e.g. Kirkland" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--r)',
                    border: '1.5px solid var(--border-med)', backgroundColor: 'var(--surface)',
                    fontSize: '0.9375rem', color: 'var(--navy)', outline: 'none',
                  }} />
              </div>
            </div>

            {/* Service Toggle */}
            <div style={{ marginBottom: '1.125rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.375rem' }}>Service</label>
              <ToggleGroup
                options={services.map(s => ({ value: s.value, label: s.label }))}
                value={form.service}
                onChange={(v) => setForm({ ...form, service: v as ServiceType })}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.125rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.375rem' }}>What needs to go?</label>
              <textarea
                rows={3}
                placeholder="e.g. 2 couches, old fridge, about 10 bags of misc stuff"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{
                  width: '100%', minHeight: 85, resize: 'none',
                  padding: '0.75rem 1rem', borderRadius: 'var(--r)',
                  border: '1.5px solid var(--border-med)', backgroundColor: 'var(--surface)',
                  fontSize: '0.9375rem', color: 'var(--navy)', outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Three yes/no toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
              {[
                { key: 'appliances' as const, label: 'Appliances?' },
                { key: 'difficultAccess' as const, label: 'Stairs / tight access?' },
                { key: 'demoRequired' as const, label: 'Demo needed?' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.375rem' }}>{label}</label>
                  <ToggleGroup
                    options={[{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
                    value={form[key]}
                    onChange={(v) => setForm({ ...form, [key]: v === 'true' || v === true })}
                  />
                </div>
              ))}
            </div>

            {/* Generate button */}
            <button onClick={handleGenerate} disabled={loading || !form.description.trim()}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: 'var(--navy)', color: '#FFFFFF',
                borderRadius: 'var(--r)', border: 'none',
                padding: '0.75rem', fontWeight: 700, fontSize: '0.9375rem',
                cursor: loading || !form.description.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !form.description.trim() ? 0.5 : 1,
                transition: 'all 0.15s',
              }}>
              {loading ? 'Generating Quote...' : 'Generate Quote'}
            </button>
          </div>

          {/* Rate Limited */}
          {rateLimited && (
            <div style={{
              borderRadius: 'var(--r)', padding: '0.875rem 1rem',
              backgroundColor: 'var(--amber-bg)', border: '1px solid rgba(146,64,14,0.12)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '1rem',
            }}>
              <Clock size={20} style={{ color: 'var(--amber)' }} />
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--amber)' }}>Too many requests</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--gray)' }}>Try again in a few minutes.</p>
              </div>
            </div>
          )}

          {/* Quote Output */}
          {quote && (
            <div>
              {quote.usedFallback && <FallbackBanner />}

              <div style={{
                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-sm)',
                padding: '1.25rem', marginBottom: '1rem',
              }}>
                {/* Price */}
                <div style={{ textAlign: 'center', marginBottom: '1.125rem' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gray)', marginBottom: 4 }}>
                    ESTIMATED PRICE RANGE
                  </div>
                  <div style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800, fontSize: '3rem', lineHeight: 1, color: 'var(--navy)' }}>
                    ${quote.priceMin}<span style={{ color: 'var(--gray)', fontSize: '2rem' }}> – </span>${quote.priceMax}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 9px', borderRadius: 8, backgroundColor: 'var(--green-bg)', color: 'var(--green)' }}>
                      {truckLabels[quote.truckSize]}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 9px', borderRadius: 8, backgroundColor: 'var(--blue-bg)', color: 'var(--blue)' }}>
                      {quote.timeEstimate}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 9px', borderRadius: 8, backgroundColor: confidenceColors[quote.confidence]?.bg || 'var(--gold-pale)', color: confidenceColors[quote.confidence]?.color || 'var(--gold)', textTransform: 'capitalize' }}>
                      {quote.confidence} confidence
                    </span>
                  </div>
                </div>

                {/* Verbal Quote Box */}
                <div style={{
                  backgroundColor: 'var(--bg)', border: '1.5px solid var(--border-med)',
                  borderRadius: 'var(--r)', padding: '1rem', marginBottom: '1rem',
                }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: '0.375rem' }}>
                    READ THIS TO THE CUSTOMER
                  </div>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--navy)', lineHeight: 1.65, fontStyle: 'italic' }}>
                    &ldquo;{quote.verbalQuote}&rdquo;
                  </p>
                  <div style={{ marginTop: '0.75rem' }}>
                    <CopyButton text={quote.verbalQuote} label="Copy quote" variant="outline" />
                  </div>
                </div>

                {/* Flags */}
                {quote.flags && quote.flags.length > 0 && (
                  <div style={{
                    backgroundColor: 'var(--amber-bg)', borderRadius: 'var(--r)',
                    padding: '0.75rem 1rem', marginBottom: '1rem',
                    fontSize: '0.8125rem', color: 'var(--amber)',
                  }}>
                    <strong>Notes: </strong>{quote.flags.join(' · ')}
                  </div>
                )}
              </div>

              {/* AI Draft Notice */}
              <AIDraftNotice tool="scope" />

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '1.125rem 0' }} />

              {/* Save buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleSave('lead')} disabled={saving}
                  style={{
                    backgroundColor: 'transparent', border: '1.5px solid var(--border-med)',
                    color: 'var(--navy)', borderRadius: 'var(--r)',
                    padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.8125rem',
                    cursor: 'pointer', opacity: saving ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}>
                  {saving ? 'Saving...' : 'Save as Lead'}
                </button>
                <button onClick={() => handleSave('quoted')} disabled={saving}
                  style={{
                    backgroundColor: 'var(--navy)', border: 'none',
                    color: '#FFFFFF', borderRadius: 'var(--r)',
                    padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.8125rem',
                    cursor: 'pointer', opacity: saving ? 0.5 : 1,
                    transition: 'all 0.15s',
                  }}>
                  {saving ? 'Saving...' : 'Save as Quoted'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
