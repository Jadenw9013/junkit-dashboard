'use client'

import { useState } from 'react'
import { CheckCircle, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { logJobAndGetReview, markJobReviewed, JobDoneInput } from '@/app/actions/jobdone'
import { ServiceType, Job } from '@/lib/types'
import BackButton from '@/components/BackButton'
import FallbackBanner from '@/components/FallbackBanner'
import FeedbackWidget from '@/components/FeedbackWidget'

const inputStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.3)',
  color: '#2D2D2D',
}

export default function JobDonePage() {
  const [form, setForm] = useState<JobDoneInput>({ customerName: '', phone: '', city: '', service: 'junk-removal', price: 0, notes: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ job: Job; reviewSMS: string; usedFallback?: boolean } | null>(null)
  const [copied, setCopied] = useState(false)
  const [marking, setMarking] = useState(false)

  async function handleSubmit() {
    if (!form.customerName.trim() || !form.price) return
    setLoading(true)
    try {
      const data = await logJobAndGetReview(form)
      setResult(data)
    } catch { toast.error('Failed to log job') }
    setLoading(false)
  }

  async function handleMarkReviewed() {
    if (!result) return
    setMarking(true)
    try {
      await markJobReviewed(result.job.id)
      toast.success('Marked as reviewed')
    } catch { toast.error('Failed to update job') }
    setMarking(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        <div className="flex items-center gap-3 py-5">
          <BackButton href="/" />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#2D2D2D' }}>Job Done</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>Log the job and get a review request ready to send</p>
          </div>
        </div>

        {!result ? (
          <div className="space-y-3">
            <input type="text" placeholder="Customer name" value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            <input type="tel" placeholder="Phone number" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
            <input type="number" placeholder="Final price charged ($)" value={form.price || ''}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            <textarea rows={3} placeholder="anything worth remembering about this job" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none" style={inputStyle} />
            <button onClick={handleSubmit} disabled={loading || !form.customerName.trim() || !form.price}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
              {loading ? 'Logging Job...' : 'Log Job + Get Review Request'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {result.usedFallback && <FallbackBanner />}

            <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
              <CheckCircle size={22} style={{ color: '#4ade80', flexShrink: 0 }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#4ade80' }}>Job logged successfully</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{form.customerName} · {form.city} · ${form.price}</p>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.4)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#F5C518' }}>Review Request SMS</span>
                <button onClick={async () => { await navigator.clipboard.writeText(result.reviewSMS); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: '#F5C518' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#2D2D2D' }}>{result.reviewSMS}</p>
              <p className="text-xs mt-3" style={{ color: '#6B7280' }}>
                Review link is already included from your settings
              </p>
            </div>

            <FeedbackWidget tool="jobdone" outputSummary={result.reviewSMS.slice(0, 100)} />

            <button onClick={handleMarkReviewed} disabled={marking} className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
              style={{ backgroundColor: 'rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.3)', color: '#F5C518' }}>
              {marking ? 'Updating...' : 'Mark as Reviewed'}
            </button>

            <button onClick={() => { setResult(null); setForm({ customerName: '', phone: '', city: '', service: 'junk-removal', price: 0, notes: '' }) }}
              className="w-full py-3 rounded-xl text-sm" style={{ color: '#6B7280' }}>
              Log Another Job
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
