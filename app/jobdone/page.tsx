'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { logJob, JobDoneInput } from '@/app/actions/jobdone'
import { ServiceType, Job } from '@/lib/types'
import BackButton from '@/components/BackButton'
import Link from 'next/link'

const inputStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.12)',
  color: '#2D2D2D',
}

export default function JobDonePage() {
  const [form, setForm] = useState<JobDoneInput>({ customerName: '', phone: '', city: '', service: 'junk-removal', price: 0, notes: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ job: Job } | null>(null)

  async function handleSubmit() {
    if (!form.customerName.trim() || !form.price) return
    setLoading(true)
    try {
      const data = await logJob(form)
      setResult(data)
    } catch { toast.error('Failed to log job') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        <div className="flex items-center gap-3 py-5">
          <BackButton href="/" />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#2D2D2D' }}>Job Done</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>Log a completed job to track revenue</p>
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

            </select>
            <input type="number" placeholder="Final price charged ($)" value={form.price || ''}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            <textarea rows={3} placeholder="Anything worth remembering about this job" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none" style={inputStyle} />
            <button onClick={handleSubmit} disabled={loading || !form.customerName.trim() || !form.price}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#F5C518', color: '#2D2D2D' }}>
              {loading ? 'Logging...' : 'Log Job'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl p-5 flex items-center gap-3" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <CheckCircle size={24} style={{ color: '#22c55e', flexShrink: 0 }} />
              <div>
                <p className="font-semibold text-sm" style={{ color: '#22c55e' }}>Job logged ✓</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{form.customerName} · {form.city} · ${form.price}</p>
              </div>
            </div>

            <button onClick={() => { setResult(null); setForm({ customerName: '', phone: '', city: '', service: 'junk-removal', price: 0, notes: '' }) }}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: '#F5C518', color: '#2D2D2D' }}>
              Log Another Job
            </button>

            <Link href="/"
              className="w-full py-3 rounded-xl text-sm text-center block"
              style={{ color: '#6B7280' }}>
              ← Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
