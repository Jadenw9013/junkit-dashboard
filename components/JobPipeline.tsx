'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Job, JobStatus } from '@/lib/types'
import CopyButton from '@/components/CopyButton'
import { markJobStatus } from '@/app/actions/jobs'

const statusConfig: Record<JobStatus, {
  label: string; color: string; bg: string; divider: string;
  nextStatus?: JobStatus; nextLabel?: string
}> = {
  lead: { label: 'Lead', color: 'var(--blue)', bg: 'var(--blue-bg)', divider: 'var(--blue-bg)', nextStatus: 'quoted', nextLabel: 'Mark Quoted' },
  quoted: { label: 'Quoted', color: 'var(--amber)', bg: 'var(--amber-bg)', divider: 'var(--amber-bg)', nextStatus: 'completed', nextLabel: 'Mark Completed' },
  completed: { label: 'Done', color: 'var(--green)', bg: 'var(--green-bg)', divider: 'var(--green-bg)', nextStatus: 'reviewed', nextLabel: 'Mark Reviewed' },
  reviewed: { label: 'Reviewed', color: 'var(--gold)', bg: 'var(--gold-pale)', divider: 'var(--gold-pale)' },
}

const serviceLabels: Record<string, string> = {
  'junk-removal': 'Junk', 'demolition': 'Demo', 'unknown': 'Other',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

interface Props { jobs: Job[] }

export default function JobPipeline({ jobs }: Props) {
  const [selected, setSelected] = useState<Job | null>(null)
  const [updating, setUpdating] = useState(false)
  const [confirmDirect, setConfirmDirect] = useState(false)

  const statuses: JobStatus[] = ['lead', 'quoted', 'completed', 'reviewed']
  const byStatus = (s: JobStatus) => jobs.filter((j) => j.status === s)

  const allEmpty = statuses.every((s) => byStatus(s).length === 0)

  async function handleTransition(job: Job, newStatus: JobStatus) {
    setUpdating(true)
    try {
      await markJobStatus(job.id, newStatus)
      toast.success(`Marked as ${statusConfig[newStatus].label}`)
      setSelected(null)
      setConfirmDirect(false)
      window.location.reload()
    } catch { toast.error('Failed to update') }
    setUpdating(false)
  }

  if (allEmpty) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 0', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gray)" strokeWidth="1.5">
            <polyline points="22,12 16,12 14,15 10,15 8,12 2,12" /><path d="M5.45,5.11,2,12v6a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V12l-3.45-6.89A2,2,0,0,0,16.76,4H7.24a2,2,0,0,0-1.79,1.11Z" />
          </svg>
        </div>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy)', marginBottom: 4 }}>Pipeline is empty</p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--gray)', maxWidth: 260, lineHeight: 1.5, marginBottom: '1rem' }}>
          Use New Lead to capture your first inquiry
        </p>
        <a href="/lead" style={{
          backgroundColor: 'var(--navy)', color: '#FFFFFF', borderRadius: 'var(--r)',
          padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 700,
          textDecoration: 'none', transition: 'all 0.15s',
        }}>New Lead →</a>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
        {statuses.map((status) => {
          const cfg = statusConfig[status]
          const statusJobs = byStatus(status)
          return (
            <div key={status}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: cfg.color }}>{cfg.label}</span>
                <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '2px 6px', borderRadius: 8, backgroundColor: cfg.bg, color: cfg.color }}>{statusJobs.length}</span>
              </div>
              {/* Divider */}
              <div style={{ height: 2, borderRadius: 2, backgroundColor: cfg.divider, marginBottom: '0.25rem' }} />
              {/* Job chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {statusJobs.slice(0, 6).map((job) => (
                  <button key={job.id} onClick={() => { setSelected(job); setConfirmDirect(false) }} style={{
                    backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '0.625rem 0.75rem',
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: 'var(--shadow-sm)', textAlign: 'left', width: '100%',
                  }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--navy)' }}>{job.customerName}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--gray)', marginTop: 1 }}>
                      {job.city || '—'} · {serviceLabels[job.service] || job.service} · {relativeTime(job.createdAt)}
                    </div>
                    {job.price && (
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', marginTop: 3 }}>${job.price}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Job detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setConfirmDirect(false) } }}>
        <DialogContent style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--navy)', maxWidth: '400px', borderRadius: 'var(--r-lg)' }}>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: 'var(--navy)' }}>{selected.customerName}</DialogTitle>
              </DialogHeader>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  {[
                    ['City', selected.city || '—'],
                    ['Service', selected.service],
                    ['Price', selected.price ? `$${selected.price}` : '—'],
                    ['Status', statusConfig[selected.status].label],
                    ['Date', formatDate(selected.createdAt)],
                    ['Phone', selected.phone || '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span style={{ color: 'var(--gray)' }}>{k}: </span>
                      <span style={{ color: 'var(--navy)', fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>

                {selected.notes && (
                  <div style={{ borderRadius: 'var(--r)', padding: '0.75rem', backgroundColor: 'var(--gray-light)', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: 4 }}>Notes</p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--navy)' }}>{selected.notes}</p>
                  </div>
                )}

                {selected.aiDraftSMS && (
                  <div style={{ borderRadius: 'var(--r)', padding: '0.75rem', backgroundColor: 'var(--gray-light)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)' }}>Draft SMS</p>
                      <CopyButton text={selected.aiDraftSMS} size={12} style={{ color: 'var(--gold)' }} />
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--navy)' }}>{selected.aiDraftSMS}</p>
                  </div>
                )}

                {statusConfig[selected.status].nextStatus && (
                  <button
                    onClick={() => handleTransition(selected, statusConfig[selected.status].nextStatus!)}
                    disabled={updating}
                    style={{
                      width: '100%', padding: '0.75rem', borderRadius: 'var(--r)',
                      fontWeight: 700, fontSize: '0.875rem',
                      backgroundColor: 'var(--navy)', color: '#FFFFFF',
                      border: 'none', cursor: 'pointer', opacity: updating ? 0.5 : 1,
                      transition: 'all 0.15s',
                    }}>
                    {updating ? 'Updating...' : statusConfig[selected.status].nextLabel}
                  </button>
                )}

                {selected.status === 'lead' && (
                  <>
                    {!confirmDirect ? (
                      <button
                        onClick={() => setConfirmDirect(true)}
                        style={{
                          width: '100%', padding: '0.625rem', borderRadius: 'var(--r)',
                          fontSize: '0.8125rem', fontWeight: 600,
                          backgroundColor: 'var(--green-bg)', border: '1px solid rgba(22,105,47,0.2)',
                          color: 'var(--green)', cursor: 'pointer',
                        }}>
                        Mark Completed (direct)
                      </button>
                    ) : (
                      <div style={{ borderRadius: 'var(--r)', padding: '0.75rem', backgroundColor: 'var(--green-bg)', border: '1px solid rgba(22,105,47,0.2)' }}>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--green)', marginBottom: '0.5rem' }}>
                          Skip the quoted step and mark as complete?
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleTransition(selected, 'completed')}
                            disabled={updating}
                            style={{
                              flex: 1, padding: '0.5rem', borderRadius: 'var(--r)',
                              fontSize: '0.8125rem', fontWeight: 700,
                              backgroundColor: 'var(--green)', color: '#FFFFFF',
                              border: 'none', cursor: 'pointer', opacity: updating ? 0.5 : 1,
                            }}>
                            {updating ? 'Updating...' : 'Yes, complete'}
                          </button>
                          <button
                            onClick={() => setConfirmDirect(false)}
                            style={{
                              flex: 1, padding: '0.5rem', borderRadius: 'var(--r)',
                              fontSize: '0.8125rem',
                              backgroundColor: 'var(--gray-light)', color: 'var(--gray)',
                              border: 'none', cursor: 'pointer',
                            }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
