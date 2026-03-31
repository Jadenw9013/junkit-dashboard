'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { draftLeadResponse, saveLeadJob } from '@/app/actions/lead'
import { ServiceType, Customer } from '@/lib/types'
import BackButton from '@/components/BackButton'
import FallbackBanner from '@/components/FallbackBanner'
import FeedbackWidget from '@/components/FeedbackWidget'

const inputStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0,0,0,0.3)',
  color: '#2D2D2D',
}

export default function LeadPage() {
  const [inquiry, setInquiry] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sms: string; email: string; usedFallback?: boolean; returningCustomer?: Customer | null } | null>(null)
  const [copiedSms, setCopiedSms] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveData, setSaveData] = useState({
    customerName: '',
    phone: '',
    city: '',
    service: 'junk-removal' as ServiceType,
  })

  async function handleDraft() {
    if (!inquiry.trim()) return
    setLoading(true)
    try {
      const data = await draftLeadResponse(inquiry)
      setResult(data)
    } catch {
      toast.error('Something went wrong')
    }
    setLoading(false)
  }

  async function copyText(text: string, type: 'sms' | 'email') {
    await navigator.clipboard.writeText(text)
    if (type === 'sms') { setCopiedSms(true); setTimeout(() => setCopiedSms(false), 2000) }
    else { setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000) }
  }

  async function handleSave() {
    if (!saveData.customerName.trim()) return
    setSaving(true)
    try {
      await saveLeadJob({ ...saveData, aiDraftSMS: result?.sms ?? '', aiDraftEmail: result?.email ?? '' })
      toast.success('Lead saved')
      setShowSaveForm(false)
    } catch { toast.error('Failed to save lead') }
    setSaving(false)
  }

  const rc = result?.returningCustomer

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        <div className="flex items-center gap-3 py-5">
          <BackButton href="/" />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#2D2D2D' }}>New Lead</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>Paste a form submission or describe what the customer said</p>
          </div>
        </div>

        <textarea
          value={inquiry}
          onChange={(e) => setInquiry(e.target.value)}
          rows={6}
          placeholder="e.g. Customer named Sarah from Kirkland, needs a full garage cleanout — two old sofas, washer/dryer, misc boxes. Wants to know price and availability."
          className="w-full rounded-xl p-4 text-sm resize-none outline-none"
          style={inputStyle}
        />

        <button
          onClick={handleDraft}
          disabled={loading || !inquiry.trim()}
          className="w-full mt-3 py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}
        >
          {loading ? 'Drafting...' : 'Draft Response'}
        </button>

        {result && (
          <div className="mt-6 space-y-4">
            {result.usedFallback && <FallbackBanner />}

            {/* Returning Customer Card */}
            {rc && (
              <div className="rounded-xl p-4" style={{
                backgroundColor: 'rgba(0,0,0,0.08)',
                border: '2px solid rgba(0,0,0,0.5)',
              }}>
                <p className="text-sm font-semibold" style={{ color: '#F5C518' }}>
                  🔄 Returning customer — {rc.name} from {rc.city}
                </p>
                <p className="text-xs mt-1" style={{ color: '#E0B115' }}>
                  {rc.totalJobs} previous job{rc.totalJobs !== 1 ? 's' : ''} · Last: {
                    rc.lastJobService === 'junk-removal' ? 'Junk Removal' :
                    rc.lastJobService === 'demolition' ? 'Demolition' :
                    rc.lastJobService === 'trailer-rental' ? 'Trailer Rental' : 'Job'
                  } · {new Date(rc.lastJobDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            )}

            {/* SMS Card */}
            <div className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.4)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#F5C518' }}>SMS</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#6B7280' }}>{result.sms.length} chars</span>
                  <button onClick={() => copyText(result.sms, 'sms')} className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: '#F5C518' }}>
                    {copiedSms ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#2D2D2D' }}>{result.sms}</p>
            </div>

            {/* Email Card */}
            <div className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(96,165,250,0.4)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#60a5fa' }}>Email</span>
                <button onClick={() => copyText(result.email, 'email')} className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                  {copiedEmail ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#2D2D2D' }}>{result.email}</p>
            </div>

            <FeedbackWidget tool="lead" outputSummary={result.sms.slice(0, 100)} />

            {!showSaveForm ? (
              <button onClick={() => setShowSaveForm(true)} className="w-full py-3 rounded-xl font-semibold text-sm" style={{ backgroundColor: 'rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.3)', color: '#F5C518' }}>
                Save as Lead
              </button>
            ) : (
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.3)' }}>
                <h3 className="text-sm font-semibold" style={{ color: '#2D2D2D' }}>Save Lead</h3>
                {(['customerName', 'phone', 'city'] as const).map((field) => (
                  <input key={field} type={field === 'phone' ? 'tel' : 'text'} placeholder={field === 'customerName' ? 'Customer name' : field === 'phone' ? 'Phone number' : 'City'}
                    value={saveData[field]} onChange={(e) => setSaveData({ ...saveData, [field]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: '#F7F6F1', border: '1px solid rgba(0,0,0,0.3)', color: '#2D2D2D' }} />
                ))}
                <select value={saveData.service} onChange={(e) => setSaveData({ ...saveData, service: e.target.value as ServiceType })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: '#F7F6F1', border: '1px solid rgba(0,0,0,0.3)', color: '#2D2D2D' }}>
                  <option value="junk-removal">Junk Removal</option>
                  <option value="demolition">Light Demolition</option>
                  <option value="trailer-rental">Trailer Rental</option>
                  <option value="unknown">Unknown</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving || !saveData.customerName.trim()} className="flex-1 py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50" style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setShowSaveForm(false)} className="flex-1 py-2.5 rounded-lg text-sm" style={{ backgroundColor: 'rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.2)', color: '#6B7280' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
