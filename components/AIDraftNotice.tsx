'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'

interface AIDraftNoticeProps {
  tool: 'lead' | 'scope' | 'message'
}

export default function AIDraftNotice({ tool }: AIDraftNoticeProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      backgroundColor: 'var(--amber-bg)',
      border: '1px solid rgba(146,64,14,0.12)',
      borderRadius: 'var(--r)',
      padding: '0.75rem 1rem',
      display: 'flex',
      gap: 8,
      alignItems: 'flex-start',
      fontSize: '0.8125rem',
      color: 'var(--amber)',
      lineHeight: 1.5,
    }}>
      <Info size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <span>AI-generated draft — always read before sending. </span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            fontWeight: 700, color: 'var(--amber)', textDecoration: 'underline',
            cursor: 'pointer', border: 'none', background: 'none', padding: 0,
            fontSize: 'inherit', fontFamily: 'inherit',
          }}
        >
          {expanded ? 'Hide' : 'Why does this sometimes get it wrong?'}
        </button>
        {expanded && (
          <p style={{ marginTop: '0.5rem' }}>
            The AI uses your Settings to write these responses. If something looks off — wrong price, wrong city, wrong tone — go to Settings and update your info. The more accurate your settings, the better the drafts.
            {tool === 'scope' && (
              <span style={{ display: 'block', marginTop: '0.375rem', fontWeight: 600 }}>
                Always confirm your final price with the customer before starting the job.
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
