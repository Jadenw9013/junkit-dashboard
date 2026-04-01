'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, CheckCircle } from 'lucide-react'
import { quickLogJob } from '@/app/actions/quicklog'
import { ServiceType } from '@/lib/types'
import BackButton from '@/components/BackButton'

const inputStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.3)',
  color: '#2D2D2D',
}

export default function QuickLogPage() {
  const router = useRouter()
  const [form, setForm] = useState({ customerName: '', service: 'junk-removal' as ServiceType, city: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleLog() {
    if (!form.customerName.trim()) return
    setLoading(true)
    try {
      await quickLogJob(form)
      setDone(true)
      setTimeout(() => router.push('/'), 1500)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        <div className="flex items-center gap-3 py-5">
          <BackButton href="/" />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#2D2D2D' }}>Quick Log</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>Fast capture — no AI, just log it</p>
          </div>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CheckCircle size={48} style={{ color: '#4ade80' }} />
            <p className="text-lg font-semibold" style={{ color: '#4ade80' }}>Logged ✓</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>Returning to dashboard…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input type="text" placeholder="Customer name" value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />
            <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value as ServiceType })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle}>
              <option value="junk-removal">Junk Removal</option>
              <option value="demolition">Light Demolition</option>

              <option value="unknown">Unknown</option>
            </select>
            <input type="text" placeholder="City" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={inputStyle} />

            <button onClick={handleLog} disabled={loading || !form.customerName.trim()}
              className="w-full py-4 rounded-xl font-bold text-base transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
              <Zap size={18} />
              {loading ? 'Logging...' : 'Log It'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
