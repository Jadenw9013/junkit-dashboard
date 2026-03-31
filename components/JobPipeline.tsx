'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Job, JobStatus } from '@/lib/types'
import CopyButton from '@/components/CopyButton'

import { markJobStatus } from '@/app/actions/jobs'

const statusConfig: Record<JobStatus, { label: string; color: string; bg: string; border: string; nextStatus?: JobStatus; nextLabel?: string }> = {
  lead: { label: 'Lead', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', nextStatus: 'quoted', nextLabel: 'Mark Quoted' },
  quoted: { label: 'Quoted', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', nextStatus: 'completed', nextLabel: 'Mark Completed' },
  completed: { label: 'Done', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', nextStatus: 'reviewed', nextLabel: 'Mark Reviewed' },
  reviewed: { label: 'Reviewed', color: '#F5C518', bg: 'rgba(245,197,24,0.08)', border: 'rgba(245,197,24,0.2)' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  const cfg = statusConfig[job.status]
  return (
    <button onClick={onClick} className="w-full text-left p-3 rounded-xl transition-opacity active:opacity-70"
      style={{ backgroundColor: '#FFFFFF', border: `1px solid ${cfg.border}` }}>
      <p className="text-sm font-medium truncate" style={{ color: '#2D2D2D' }}>{job.customerName}</p>
      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{job.city || '—'} · {formatDate(job.createdAt)}</p>
    </button>
  )
}

interface Props {
  jobs: Job[]
}

export default function JobPipeline({ jobs }: Props) {
  const [selected, setSelected] = useState<Job | null>(null)
  const [updating, setUpdating] = useState(false)
  const [confirmDirect, setConfirmDirect] = useState(false)

  const statuses: JobStatus[] = ['lead', 'quoted', 'completed', 'reviewed']
  const byStatus = (s: JobStatus) => jobs.filter((j) => j.status === s)

  async function handleTransition(job: Job, newStatus: JobStatus) {
    setUpdating(true)
    try {
      await markJobStatus(job.id, newStatus)
      toast.success(`Marked as ${statusConfig[newStatus].label}`)
      setSelected(null)
      setConfirmDirect(false)
      window.location.reload()
    } catch {
      toast.error('Failed to update')
    }
    setUpdating(false)
  }

  return (
    <>
      {/* Horizontal scroll pipeline */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3 min-w-max pb-2">
          {statuses.map((status) => {
            const cfg = statusConfig[status]
            const statusJobs = byStatus(status)
            return (
              <div key={status} className="w-[180px] shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    {statusJobs.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {statusJobs.length === 0 ? (
                    <div className="p-3 rounded-xl text-xs text-center" style={{ color: '#9CA3AF', border: '1px dashed rgba(0,0,0,0.1)' }}>Empty</div>
                  ) : (
                    statusJobs.slice(0, 6).map((job) => (
                      <JobCard key={job.id} job={job} onClick={() => { setSelected(job); setConfirmDirect(false) }} />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Job detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setConfirmDirect(false) } }}>
        <DialogContent style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', color: '#2D2D2D', maxWidth: '380px' }}>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle style={{ color: '#2D2D2D' }}>{selected.customerName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ['City', selected.city || '—'],
                    ['Service', selected.service],
                    ['Price', selected.price ? `$${selected.price}` : '—'],
                    ['Status', statusConfig[selected.status].label],
                    ['Date', formatDate(selected.createdAt)],
                    ['Phone', selected.phone || '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span style={{ color: '#6B7280' }}>{k}: </span>
                      <span style={{ color: '#2D2D2D' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {selected.notes && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: '#F7F6F1', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <p className="text-xs" style={{ color: '#6B7280' }}>Notes</p>
                    <p className="text-xs mt-1" style={{ color: '#2D2D2D' }}>{selected.notes}</p>
                  </div>
                )}

                {selected.aiDraftSMS && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: '#F7F6F1', border: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold" style={{ color: '#F5C518' }}>Draft SMS</p>
                      <CopyButton text={selected.aiDraftSMS} size={12} style={{ color: '#F5C518' }} />
                    </div>
                    <p className="text-xs" style={{ color: '#2D2D2D' }}>{selected.aiDraftSMS}</p>
                  </div>
                )}

                {statusConfig[selected.status].nextStatus && (
                  <button
                    onClick={() => handleTransition(selected, statusConfig[selected.status].nextStatus!)}
                    disabled={updating}
                    className="w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                    style={{ backgroundColor: '#F5C518', color: '#2D2D2D' }}>
                    {updating ? 'Updating...' : statusConfig[selected.status].nextLabel}
                  </button>
                )}

                {/* Direct lead → completed path */}
                {selected.status === 'lead' && (
                  <>
                    {!confirmDirect ? (
                      <button
                        onClick={() => setConfirmDirect(true)}
                        className="w-full py-2.5 rounded-xl text-xs font-medium"
                        style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                        Mark Completed (direct)
                      </button>
                    ) : (
                      <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                        <p className="text-xs mb-2" style={{ color: '#16a34a' }}>
                          Skip the quoted step and mark as complete?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTransition(selected, 'completed')}
                            disabled={updating}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                            style={{ backgroundColor: '#22c55e', color: '#FFFFFF' }}>
                            {updating ? 'Updating...' : 'Yes, complete'}
                          </button>
                          <button
                            onClick={() => setConfirmDirect(false)}
                            className="flex-1 py-2 rounded-lg text-xs"
                            style={{ backgroundColor: '#F0EFE9', color: '#6B7280' }}>
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
