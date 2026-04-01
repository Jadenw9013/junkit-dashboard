'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Inbox, Search, Filter, ChevronDown, ChevronRight,
  Clock, CheckCircle, MessageSquare, Archive,
  Phone, MapPin, DollarSign, Bot, Copy, Check
} from 'lucide-react'
import { toast } from 'sonner'
import { Job, JobStatus } from '@/lib/types'
import { getInboxLeads, updateLeadStatus, archiveLead } from '@/app/actions/inbox'

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string; dot: string }> = {
  lead: { label: 'New', color: 'var(--gold)', bg: 'var(--gold-pale)', dot: '#F5C518' },
  quoted: { label: 'Quoted', color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
  completed: { label: 'Won', color: 'var(--green)', bg: 'var(--green-bg)', dot: '#16692F' },
  reviewed: { label: 'Archived', color: 'var(--gray)', bg: 'var(--gray-light)', dot: '#9CA3AF' },
}

const SERVICE_LABELS: Record<string, string> = {
  'junk-removal': 'Junk Removal',
  'demolition': 'Light Demo',
  'unknown': 'Unknown',
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function InboxClient() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    const data = await getInboxLeads()
    setJobs(data)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  function handleStatusChange(id: string, status: JobStatus) {
    startTransition(async () => {
      await updateLeadStatus(id, status)
      await loadData()
      toast.success(`Status updated to ${STATUS_CONFIG[status].label}`)
    })
  }

  function handleArchive(id: string) {
    startTransition(async () => {
      await archiveLead(id)
      await loadData()
      toast.success('Lead archived')
    })
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // --- Filter + search ---
  const filtered = jobs.filter((j) => {
    if (statusFilter !== 'all' && j.status !== statusFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        j.customerName.toLowerCase().includes(q) ||
        j.phone.includes(q) ||
        j.city.toLowerCase().includes(q)
      )
    }
    return true
  })

  const statusCounts = {
    all: jobs.length,
    lead: jobs.filter((j) => j.status === 'lead').length,
    quoted: jobs.filter((j) => j.status === 'quoted').length,
    completed: jobs.filter((j) => j.status === 'completed').length,
    reviewed: jobs.filter((j) => j.status === 'reviewed').length,
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>
        Loading leads...
      </div>
    )
  }

  return (
    <div>
      {/* Status Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1rem',
        backgroundColor: 'var(--gray-light)', borderRadius: 'var(--r)', padding: 3,
      }}>
        {(['all', 'lead', 'quoted', 'completed', 'reviewed'] as const).map((s) => {
          const isActive = statusFilter === s
          const label = s === 'all' ? 'All' : STATUS_CONFIG[s].label
          const count = statusCounts[s]
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                flex: 1, padding: '0.5rem 0.75rem', borderRadius: 'var(--r)',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                fontSize: '0.8125rem', fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? 'var(--surface)' : 'transparent',
                color: isActive ? 'var(--navy)' : 'var(--gray)',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {s !== 'all' && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  backgroundColor: STATUS_CONFIG[s].dot,
                  flexShrink: 0,
                }} />
              )}
              {label}
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700,
                backgroundColor: isActive ? 'var(--bg)' : 'transparent',
                color: isActive ? 'var(--navy)' : 'var(--gray)',
                padding: '1px 5px', borderRadius: 8, minWidth: 18, textAlign: 'center',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search Bar */}
      <div style={{
        position: 'relative', marginBottom: '1rem',
      }}>
        <Search size={15} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--gray)', opacity: 0.6,
        }} />
        <input
          type="text"
          placeholder="Search name, phone, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem',
            borderRadius: 'var(--r)', border: '1.5px solid var(--border-med)',
            backgroundColor: 'var(--surface)', fontSize: '0.875rem',
            color: 'var(--navy)', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Lead List */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '3rem 2rem', textAlign: 'center',
          backgroundColor: 'var(--surface)', borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
        }}>
          <Inbox size={36} color="var(--gray)" style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>
            {searchQuery ? 'No leads found' : 'Inbox empty'}
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gray)' }}>
            {searchQuery
              ? 'Try a different search term'
              : 'New leads will appear here as they come in via your contact form.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.map((job) => {
            const isExpanded = expandedId === job.id
            const cfg = STATUS_CONFIG[job.status]
            const hasAIDraft = !!job.aiDraftSMS

            return (
              <div key={job.id} style={{
                backgroundColor: 'var(--surface)',
                border: `1.5px solid ${isExpanded ? 'var(--gold-border)' : 'var(--border)'}`,
                borderRadius: 'var(--r-lg)',
                overflow: 'hidden',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                boxShadow: isExpanded ? '0 2px 12px rgba(0,0,0,0.06)' : 'none',
              }}>
                {/* Row Header — clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : job.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '0.875rem 1rem', cursor: 'pointer',
                    border: 'none', backgroundColor: 'transparent', textAlign: 'left',
                  }}
                >
                  {/* Expand icon */}
                  {isExpanded
                    ? <ChevronDown size={14} color="var(--gray)" />
                    : <ChevronRight size={14} color="var(--gray)" />
                  }

                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    backgroundColor: cfg.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.75rem', color: cfg.color,
                    fontFamily: 'var(--font-barlow-condensed, sans-serif)',
                    flexShrink: 0,
                  }}>
                    {job.customerName
                      ? job.customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : '?'}
                  </div>

                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {job.customerName || 'Unknown'}
                    </div>
                    <div style={{
                      fontSize: '0.75rem', color: 'var(--gray)',
                      display: 'flex', alignItems: 'center', gap: 8, marginTop: 2,
                    }}>
                      {job.city && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <MapPin size={10} /> {job.city}
                        </span>
                      )}
                      <span>{SERVICE_LABELS[job.service] ?? job.service}</span>
                      {job.source === 'webhook' && (
                        <span style={{
                          fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.04em', backgroundColor: '#EDE9FE', color: '#7C3AED',
                          padding: '1px 5px', borderRadius: 4,
                        }}>
                          FORM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: cfg.bg, color: cfg.color,
                    padding: '3px 10px', borderRadius: 10, flexShrink: 0,
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      backgroundColor: cfg.dot,
                    }} />
                    {cfg.label}
                  </span>

                  {/* AI badge */}
                  {hasAIDraft && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      fontSize: '0.625rem', fontWeight: 700, color: '#7C3AED',
                      backgroundColor: '#F5F3FF', padding: '2px 7px', borderRadius: 4,
                      flexShrink: 0,
                    }}>
                      <Bot size={10} /> AI
                    </span>
                  )}

                  {/* Time */}
                  <span style={{
                    fontSize: '0.75rem', color: 'var(--gray)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <Clock size={11} /> {timeAgo(job.createdAt)}
                  </span>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '1rem 1rem 1rem 3.5rem',
                    backgroundColor: 'var(--bg)',
                  }}>
                    {/* Meta row */}
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem',
                    }}>
                      {job.phone && (
                        <a href={`tel:${job.phone}`} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontSize: '0.8125rem', color: 'var(--navy)', fontWeight: 600,
                          textDecoration: 'none',
                        }}>
                          <Phone size={13} color="var(--gold)" /> {job.phone}
                        </a>
                      )}
                      {job.price != null && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          fontSize: '0.8125rem', color: 'var(--green)', fontWeight: 700,
                        }}>
                          <DollarSign size={13} /> ${job.price}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                        Created {new Date(job.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: 'numeric', minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Notes */}
                    {job.notes && (
                      <div style={{
                        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r)', padding: '0.75rem 1rem',
                        fontSize: '0.8125rem', color: 'var(--navy)', lineHeight: 1.6,
                        marginBottom: '0.875rem',
                      }}>
                        <div style={{
                          fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.08em', color: 'var(--gray)', marginBottom: 4,
                        }}>Notes</div>
                        {job.notes}
                      </div>
                    )}

                    {/* AI Draft SMS */}
                    {job.aiDraftSMS && (
                      <div style={{
                        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r)', overflow: 'hidden',
                        marginBottom: '0.875rem',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem', backgroundColor: 'var(--gray-light)',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MessageSquare size={12} color="var(--navy)" />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--navy-mid)' }}>
                              AI Draft SMS
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--gray)' }}>
                              {job.aiDraftSMS.length}/160
                            </span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(job.aiDraftSMS!, `sms-${job.id}`) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface)', cursor: 'pointer',
                              fontSize: '0.6875rem', fontWeight: 600, color: 'var(--navy)',
                            }}
                          >
                            {copiedId === `sms-${job.id}` ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                          </button>
                        </div>
                        <div style={{
                          padding: '0.75rem 1rem', fontSize: '0.8125rem',
                          color: 'var(--navy)', lineHeight: 1.6,
                        }}>
                          {job.aiDraftSMS}
                        </div>
                      </div>
                    )}

                    {/* AI Draft Email */}
                    {job.aiDraftEmail && (
                      <div style={{
                        backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--r)', overflow: 'hidden',
                        marginBottom: '0.875rem',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem', backgroundColor: 'var(--gray-light)',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <MessageSquare size={12} color="#2563EB" />
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--navy-mid)' }}>
                              AI Draft Email
                            </span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(job.aiDraftEmail!, `email-${job.id}`) }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border)',
                              backgroundColor: 'var(--surface)', cursor: 'pointer',
                              fontSize: '0.6875rem', fontWeight: 600, color: 'var(--navy)',
                            }}
                          >
                            {copiedId === `email-${job.id}` ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                          </button>
                        </div>
                        <div style={{
                          padding: '0.75rem 1rem', fontSize: '0.8125rem',
                          color: 'var(--navy)', lineHeight: 1.6, whiteSpace: 'pre-line',
                          maxHeight: 200, overflowY: 'auto',
                        }}>
                          {job.aiDraftEmail}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{
                      display: 'flex', gap: '0.375rem', flexWrap: 'wrap',
                    }}>
                      {job.status === 'lead' && (
                        <button
                          onClick={() => handleStatusChange(job.id, 'quoted')}
                          disabled={isPending}
                          style={{
                            padding: '0.4375rem 0.875rem', borderRadius: 'var(--r)',
                            border: 'none', cursor: 'pointer',
                            backgroundColor: 'var(--navy)', color: '#FFFFFF',
                            fontSize: '0.8125rem', fontWeight: 700,
                            opacity: isPending ? 0.6 : 1,
                          }}
                        >
                          Mark Quoted
                        </button>
                      )}
                      {(job.status === 'lead' || job.status === 'quoted') && (
                        <button
                          onClick={() => handleStatusChange(job.id, 'completed')}
                          disabled={isPending}
                          style={{
                            padding: '0.4375rem 0.875rem', borderRadius: 'var(--r)',
                            border: '1.5px solid var(--green)',
                            backgroundColor: 'var(--green-bg)', color: 'var(--green)',
                            fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer',
                            opacity: isPending ? 0.6 : 1,
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <CheckCircle size={13} /> Mark Won
                          </span>
                        </button>
                      )}
                      {job.status !== 'reviewed' && (
                        <button
                          onClick={() => handleArchive(job.id)}
                          disabled={isPending}
                          style={{
                            padding: '0.4375rem 0.875rem', borderRadius: 'var(--r)',
                            border: '1px solid var(--border)', backgroundColor: 'transparent',
                            color: 'var(--gray)', fontSize: '0.8125rem', fontWeight: 600,
                            cursor: 'pointer', opacity: isPending ? 0.6 : 1,
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                        >
                          <Archive size={13} /> Archive
                        </button>
                      )}
                      {job.phone && (
                        <a
                          href={`tel:${job.phone}`}
                          style={{
                            padding: '0.4375rem 0.875rem', borderRadius: 'var(--r)',
                            border: '1px solid var(--border)', backgroundColor: 'transparent',
                            color: 'var(--navy)', fontSize: '0.8125rem', fontWeight: 600,
                            cursor: 'pointer', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', gap: 5,
                          }}
                        >
                          <Phone size={13} /> Call
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Count footer */}
      {filtered.length > 0 && (
        <div style={{
          marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--gray)',
          textAlign: 'center',
        }}>
          {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
          {statusFilter !== 'all' ? ` · ${STATUS_CONFIG[statusFilter].label}` : ''}
          {searchQuery ? ` · matching "${searchQuery}"` : ''}
        </div>
      )}
    </div>
  )
}
