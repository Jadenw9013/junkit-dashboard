'use client'

import { useState, useEffect, useTransition } from 'react'
import { CheckCircle, Send, SkipForward, MessageSquare, RefreshCw } from 'lucide-react'
import {
  sendApprovalItem,
  skipApprovalItem,
  sendAllApprovals,
  clearApprovals,
  getPendingApprovals,
} from '@/app/actions/approvals'

interface ApprovalItem {
  jobId?: string
  customerId?: string
  customerName: string
  phone: string
  city: string
  sms: string
  daysSince?: number
  monthsSince?: number
  sent?: boolean
  skipped?: boolean
  sentAt?: string
}

interface PendingBatch {
  generatedAt: string
  items: ApprovalItem[]
}

export default function ApprovalsClient() {
  const [followups, setFollowups] = useState<PendingBatch | null>(null)
  const [reengagements, setReengagements] = useState<PendingBatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  async function loadData() {
    setLoading(true)
    const data = await getPendingApprovals()
    setFollowups(data.followups)
    setReengagements(data.reengagements)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const followupItems = followups?.items?.filter((i: ApprovalItem) => !i.sent && !i.skipped) ?? []
  const reengagementItems = reengagements?.items?.filter((i: ApprovalItem) => !i.sent && !i.skipped) ?? []
  const hasItems = followupItems.length > 0 || reengagementItems.length > 0

  function handleSend(type: 'followup' | 'reengagement', index: number) {
    startTransition(async () => {
      await sendApprovalItem(type, index)
      await loadData()
    })
  }

  function handleSkip(type: 'followup' | 'reengagement', index: number) {
    startTransition(async () => {
      await skipApprovalItem(type, index)
      await loadData()
    })
  }

  function handleSendAll(type: 'followup' | 'reengagement') {
    startTransition(async () => {
      await sendAllApprovals(type)
      await loadData()
    })
  }

  function handleClear(type: 'followup' | 'reengagement') {
    startTransition(async () => {
      await clearApprovals(type)
      await loadData()
    })
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray)' }}>
        Loading approvals...
      </div>
    )
  }

  if (!hasItems) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <CheckCircle size={28} color="var(--green)" />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.5rem' }}>
          All caught up — no approvals pending
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--gray)', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
          The AI will prepare follow-ups and re-engagement messages automatically. They&apos;ll appear here for your review before sending.
        </p>
        <button
          onClick={loadData}
          style={{
            marginTop: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0.5rem 1rem', borderRadius: 'var(--r)', border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)', color: 'var(--navy)', fontSize: '0.8125rem',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Follow-ups */}
      {followupItems.length > 0 && (
        <ApprovalSection
          title="Follow-ups"
          subtitle={`Generated ${followups?.generatedAt ? new Date(followups.generatedAt).toLocaleDateString() : 'recently'} — ${followupItems.length} leads haven't responded in 7+ days`}
          items={followupItems}
          allItems={followups?.items ?? []}
          type="followup"
          onSend={handleSend}
          onSkip={handleSkip}
          onSendAll={handleSendAll}
          onClear={handleClear}
          isPending={isPending}
        />
      )}

      {/* Re-engagements */}
      {reengagementItems.length > 0 && (
        <ApprovalSection
          title="Re-engagements"
          subtitle={`Customers not seen in 6+ months — ${reengagementItems.length} messages ready`}
          items={reengagementItems}
          allItems={reengagements?.items ?? []}
          type="reengagement"
          onSend={handleSend}
          onSkip={handleSkip}
          onSendAll={handleSendAll}
          onClear={handleClear}
          isPending={isPending}
        />
      )}
    </div>
  )
}

function ApprovalSection({
  title, subtitle, items, allItems, type, onSend, onSkip, onSendAll, onClear, isPending,
}: {
  title: string
  subtitle: string
  items: ApprovalItem[]
  allItems: ApprovalItem[]
  type: 'followup' | 'reengagement'
  onSend: (type: 'followup' | 'reengagement', index: number) => void
  onSkip: (type: 'followup' | 'reengagement', index: number) => void
  onSendAll: (type: 'followup' | 'reengagement') => void
  onClear: (type: 'followup' | 'reengagement') => void
  isPending: boolean
}) {
  return (
    <div>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.25rem' }}>
        {title}
      </h2>
      <p style={{ fontSize: '0.8125rem', color: 'var(--gray)', marginBottom: '1rem' }}>{subtitle}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        {items.map((item, _displayIdx) => {
          // Find the real index in allItems
          const realIndex = allItems.findIndex(
            (ai) => ai.phone === item.phone && ai.customerName === item.customerName && !ai.sent && !ai.skipped
          )

          return (
            <div
              key={`${item.phone}-${_displayIdx}`}
              style={{
                backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', padding: '1rem', boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.9375rem' }}>{item.customerName}</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--gray)', marginLeft: 8 }}>
                    {item.city} · {item.daysSince ? `${item.daysSince} days ago` : `${item.monthsSince ?? '?'} months ago`}
                  </span>
                </div>
                <MessageSquare size={16} color="var(--gray)" style={{ opacity: 0.4 }} />
              </div>

              <textarea
                readOnly
                value={item.sms}
                style={{
                  width: '100%', minHeight: 60, padding: '0.625rem',
                  borderRadius: 'var(--r)', border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)', color: 'var(--navy)',
                  fontSize: '0.8125rem', lineHeight: 1.5, resize: 'none',
                  fontFamily: 'inherit',
                }}
              />

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.625rem' }}>
                <button
                  onClick={() => onSend(type, realIndex)}
                  disabled={isPending}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: 'var(--r)',
                    backgroundColor: 'var(--navy)', color: '#FFFFFF',
                    border: 'none', fontSize: '0.8125rem', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6, opacity: isPending ? 0.6 : 1,
                  }}
                >
                  <Send size={13} /> Send
                </button>
                <button
                  onClick={() => onSkip(type, realIndex)}
                  disabled={isPending}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: 'var(--r)',
                    backgroundColor: 'transparent', color: 'var(--gray)',
                    border: '1px solid var(--border)', fontSize: '0.8125rem', fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 6, opacity: isPending ? 0.6 : 1,
                  }}
                >
                  <SkipForward size={13} /> Skip
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onSendAll(type)}
          disabled={isPending}
          style={{
            flex: 1, padding: '0.625rem', borderRadius: 'var(--r)',
            backgroundColor: 'var(--gold-light)', color: 'var(--navy)',
            border: 'none', fontSize: '0.875rem', fontWeight: 700,
            cursor: 'pointer', opacity: isPending ? 0.6 : 1,
          }}
        >
          Send All ({items.length})
        </button>
        <button
          onClick={() => onClear(type)}
          disabled={isPending}
          style={{
            padding: '0.625rem 1rem', borderRadius: 'var(--r)',
            backgroundColor: 'transparent', color: 'var(--gray)',
            border: '1px solid var(--border)', fontSize: '0.8125rem', fontWeight: 600,
            cursor: 'pointer', opacity: isPending ? 0.6 : 1,
          }}
        >
          Clear All
        </button>
      </div>
    </div>
  )
}
