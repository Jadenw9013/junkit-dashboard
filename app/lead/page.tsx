'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { draftLeadResponse, saveLeadJob } from '@/app/actions/lead'
import { ServiceType, Customer } from '@/lib/types'
import FallbackBanner from '@/components/FallbackBanner'
import AIDraftNotice from '@/components/AIDraftNotice'
import CopyButton from '@/components/CopyButton'

export default function LeadPage() {
  const [inquiry, setInquiry] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ sms: string; email: string; usedFallback?: boolean; returningCustomer?: Customer | null } | null>(null)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveData, setSaveData] = useState({
    customerName: '', phone: '', city: '',
    service: 'junk-removal' as ServiceType,
  })

  async function handleDraft() {
    if (!inquiry.trim()) return
    setLoading(true)
    try {
      const data = await draftLeadResponse(inquiry)
      setResult(data)
    } catch { toast.error('Something went wrong') }
    setLoading(false)
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

  function handleStartOver() {
    setResult(null)
    setInquiry('')
    setShowSaveForm(false)
  }

  const rc = result?.returningCustomer

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar placeholder — rendered by importing in a wrapper or using the same pattern */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)' }}>
        {/* Topbar */}
        <div style={{
          backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)',
          height: 58, padding: '0 1.75rem',
          display: 'flex', alignItems: 'center',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <h1 style={{ fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800, fontSize: '1.375rem', color: 'var(--navy)' }}>
            New Lead
          </h1>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem 1.75rem', maxWidth: 900 }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '1.25rem' }}>
            Paste what the customer said — get a ready-to-send response in seconds.
          </p>

          {/* Returning Customer Card */}
          {rc && (
            <div style={{
              backgroundColor: 'var(--gold-pale)', border: '1.5px solid var(--gold-border)',
              borderRadius: 'var(--r-lg)', padding: '0.875rem 1.125rem',
              marginBottom: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.875rem',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                backgroundColor: 'var(--gold-light)', color: 'var(--navy)',
                fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800,
                fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {rc.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)' }}>{rc.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 500, marginTop: 1 }}>
                  Returning customer · {rc.totalJobs} past job{rc.totalJobs !== 1 ? 's' : ''} · Last: {
                    rc.lastJobService === 'junk-removal' ? 'Junk Removal' :
                    rc.lastJobService === 'demolition' ? 'Demolition' :
                    rc.lastJobService === 'trailer-rental' ? 'Trailer Rental' : 'Job'
                  }, {new Date(rc.lastJobDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </div>
              <span style={{
                flexShrink: 0, fontSize: '0.625rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                backgroundColor: 'var(--gold)', color: '#FFFFFF',
                padding: '3px 9px', borderRadius: 10,
              }}>RETURNING</span>
            </div>
          )}

          {/* Inquiry Input */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.375rem' }}>Customer inquiry</label>
            <textarea
              value={inquiry}
              onChange={(e) => setInquiry(e.target.value)}
              rows={5}
              placeholder="e.g. Hi, I have an old sectional, washer/dryer, and boxes in my garage in Kirkland. Easy driveway access. How much and can you come this week?"
              style={{
                width: '100%', resize: 'none', minHeight: 130,
                backgroundColor: 'var(--surface)', border: '1.5px solid var(--border-med)',
                borderRadius: 'var(--r)', padding: '0.75rem 1rem',
                fontSize: '0.9375rem', color: 'var(--navy)',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: '0.3125rem' }}>
              Paste a text, email, or form submission — or type what they told you on the phone.
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleDraft}
            disabled={loading || !inquiry.trim()}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: 'var(--navy)', color: '#FFFFFF',
              borderRadius: 'var(--r)', border: 'none',
              padding: '0.75rem', fontWeight: 700, fontSize: '0.9375rem',
              cursor: loading || !inquiry.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !inquiry.trim() ? 0.5 : 1,
              transition: 'all 0.15s', marginBottom: '1.375rem',
            }}
          >
            {loading ? 'Drafting...' : 'Draft Response'}
            {!loading && <ArrowRight size={15} />}
          </button>

          {/* Output Section */}
          {result && (
            <div>
              {result.usedFallback && <FallbackBanner />}

              {/* SMS Output Card */}
              <div style={{
                backgroundColor: 'var(--surface)', border: '1.5px solid var(--border-med)',
                borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '0.875rem',
              }}>
                <div style={{
                  backgroundColor: 'var(--gray-light)', borderBottom: '1px solid var(--border)',
                  padding: '0.75rem 1.125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ backgroundColor: 'var(--navy)', color: '#FFFFFF', fontSize: '0.625rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>SMS</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--navy-mid)' }}>Response</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{result.sms.length} / 160 chars</span>
                </div>
                <div style={{ padding: '1.125rem', fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--navy)' }}>
                  {result.sms}
                </div>
                <div style={{ padding: '0.625rem 1.125rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <CopyButton text={result.sms} label="Copy SMS" variant="gold" />
                </div>
              </div>

              {/* Email Output Card */}
              <div style={{
                backgroundColor: 'var(--surface)', border: '1.5px solid var(--border-med)',
                borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: '0.875rem',
              }}>
                <div style={{
                  backgroundColor: 'var(--gray-light)', borderBottom: '1px solid var(--border)',
                  padding: '0.75rem 1.125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ backgroundColor: 'var(--blue)', color: '#FFFFFF', fontSize: '0.625rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>EMAIL</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--navy-mid)' }}>Response</span>
                  </div>
                </div>
                <div style={{ padding: '1.125rem', fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--navy)', whiteSpace: 'pre-line' }}>
                  {result.email}
                </div>
                <div style={{ padding: '0.625rem 1.125rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                  <CopyButton text={result.email} label="Copy email" variant="outline" />
                </div>
              </div>

              {/* AI Draft Notice */}
              <AIDraftNotice tool="lead" />

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '1.125rem 0' }} />

              {/* Action Buttons */}
              {!showSaveForm ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setShowSaveForm(true)} style={{
                    backgroundColor: 'transparent', border: '1.5px solid var(--border-med)',
                    color: 'var(--navy)', borderRadius: 'var(--r)',
                    padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.8125rem',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>Save as Lead</button>
                  <button onClick={handleStartOver} style={{
                    backgroundColor: 'transparent', border: 'none',
                    color: 'var(--gray)', borderRadius: 'var(--r)',
                    padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.8125rem',
                    cursor: 'pointer',
                  }}>Start over</button>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)', padding: '1.25rem',
                }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem' }}>Save Lead</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '0.875rem' }}>
                    {(['customerName', 'phone', 'city'] as const).map((field) => (
                      <input key={field} type={field === 'phone' ? 'tel' : 'text'}
                        placeholder={field === 'customerName' ? 'Customer name' : field === 'phone' ? 'Phone number' : 'City'}
                        value={saveData[field]} onChange={(e) => setSaveData({ ...saveData, [field]: e.target.value })}
                        style={{
                          width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--r)',
                          border: '1.5px solid var(--border-med)', backgroundColor: 'var(--surface)',
                          fontSize: '0.9375rem', color: 'var(--navy)', outline: 'none',
                        }} />
                    ))}
                    <select value={saveData.service} onChange={(e) => setSaveData({ ...saveData, service: e.target.value as ServiceType })}
                      style={{
                        width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--r)',
                        border: '1.5px solid var(--border-med)', backgroundColor: 'var(--surface)',
                        fontSize: '0.9375rem', color: 'var(--navy)', outline: 'none',
                      }}>
                      <option value="junk-removal">Junk Removal</option>
                      <option value="demolition">Light Demolition</option>
                      <option value="trailer-rental">Trailer Rental</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleSave} disabled={saving || !saveData.customerName.trim()} style={{
                      flex: 1, padding: '0.625rem', borderRadius: 'var(--r)',
                      fontWeight: 700, fontSize: '0.875rem',
                      backgroundColor: 'var(--navy)', color: '#FFFFFF',
                      border: 'none', cursor: 'pointer', opacity: saving || !saveData.customerName.trim() ? 0.5 : 1,
                    }}>{saving ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setShowSaveForm(false)} style={{
                      flex: 1, padding: '0.625rem', borderRadius: 'var(--r)',
                      fontSize: '0.875rem', fontWeight: 600,
                      backgroundColor: 'var(--gray-light)', color: 'var(--gray)',
                      border: 'none', cursor: 'pointer',
                    }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
