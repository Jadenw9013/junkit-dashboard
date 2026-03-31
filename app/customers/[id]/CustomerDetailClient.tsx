'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Plus, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Customer, Job } from '@/lib/types'
import { updateCustomerNotes } from '@/app/actions/customers'
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

export default function CustomerDetailClient({ customer, jobs }: { customer: Customer; jobs: Job[] }) {
  const [notes, setNotes] = useState(customer.notes)
  const [tags, setTags] = useState<string[]>(customer.tags)
  const [newTag, setNewTag] = useState('')
  const [saving, setSaving] = useState(false)

  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  async function saveNotes() {
    setSaving(true)
    try {
      await updateCustomerNotes(customer.id, notes, tags)
      toast.success('Notes saved')
    } catch {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  function addTag() {
    const t = newTag.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    const updated = [...tags, t]
    setTags(updated)
    setNewTag('')
    // auto-save tags
    updateCustomerNotes(customer.id, notes, updated)
  }

  function removeTag(tag: string) {
    const updated = tags.filter((t) => t !== tag)
    setTags(updated)
    updateCustomerNotes(customer.id, notes, updated)
  }

  const memberSince = new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Re-engage params
  const monthsSinceLast = Math.max(
    1,
    Math.round((Date.now() - new Date(customer.lastJobDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  )
  const monthsBucket =
    monthsSinceLast <= 3 ? '1-3' : monthsSinceLast <= 6 ? '3-6' : monthsSinceLast <= 12 ? '6-12' : '12+'
  const reEngageUrl = `/message?tab=reengagement&name=${encodeURIComponent(customer.name)}&service=${encodeURIComponent(customer.lastJobService)}&months=${monthsBucket}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        <div className="flex items-center gap-3 py-5">
          <BackButton href="/customers" />
          <h1 className="text-xl font-bold" style={{ color: '#2D2D2D' }}>{customer.name}</h1>
        </div>

        {/* Header Card */}
        <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.3)' }}>
          <p className="text-sm" style={{ color: '#6B7280' }}>{customer.phone} · {customer.city}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#F7F6F1' }}>
              <p className="text-lg font-bold" style={{ color: '#F5C518' }}>{customer.totalJobs}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Total Jobs</p>
            </div>
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#F7F6F1' }}>
              <p className="text-lg font-bold" style={{ color: '#4ade80' }}>${customer.totalRevenue.toLocaleString()}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Revenue</p>
            </div>
            <div className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#F7F6F1' }}>
              <p className="text-xs font-bold" style={{ color: '#E0B115' }}>{memberSince}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>Member Since</p>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa' }}>
                  {t}
                  <button onClick={() => removeTag(t)}><X size={10} /></button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  className="w-20 px-2 py-1 rounded-lg text-xs outline-none"
                  style={{ backgroundColor: '#F7F6F1', border: '1px solid rgba(0,0,0,0.2)', color: '#2D2D2D' }}
                />
                <button onClick={addTag} className="p-1 rounded" style={{ color: '#F5C518' }}><Plus size={12} /></button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <p className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>Private Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Add notes about this customer..."
              rows={3}
              className="w-full rounded-lg p-3 text-sm resize-none outline-none"
              style={{ backgroundColor: '#F7F6F1', border: '1px solid rgba(0,0,0,0.2)', color: '#2D2D2D' }}
            />
            {saving && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Saving...</p>}
          </div>
        </div>

        {/* Job History */}
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
          Job History
        </h2>
        {sortedJobs.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#6B7280' }}>No jobs found.</p>
        ) : (
          <div className="space-y-2 mb-6">
            {sortedJobs.map((j) => {
              const sc = statusColors[j.status] || statusColors.lead
              return (
                <div key={j.id} className="rounded-xl p-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.15)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#2D2D2D' }}>
                        {serviceLabels[j.service] || j.service}
                      </p>
                      <p className="text-xs" style={{ color: '#6B7280' }}>
                        {new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {j.city}
                      </p>
                    </div>
                    <div className="text-right">
                      {j.price != null && (
                        <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>${j.price.toLocaleString()}</p>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.text }}>
                        {j.status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Re-engage Button */}
        <Link href={reEngageUrl}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-opacity active:opacity-80"
          style={{ backgroundColor: 'rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.3)', color: '#F5C518' }}>
          <RotateCcw size={16} />
          Re-engage Customer
        </Link>
      </div>
    </div>
  )
}
