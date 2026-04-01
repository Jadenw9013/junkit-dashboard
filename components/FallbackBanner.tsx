'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

export default function FallbackBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      backgroundColor: 'var(--amber-bg)',
      border: '1px solid rgba(146,64,14,0.12)',
      borderRadius: 'var(--r)',
      padding: '0.75rem 1rem',
      marginBottom: '0.875rem',
    }}>
      <AlertTriangle size={14} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
      <p style={{ flex: 1, fontSize: '0.8125rem', color: 'var(--amber)', lineHeight: 1.5 }}>
        AI unavailable — showing template response. Edit before sending.
      </p>
      <button onClick={() => setDismissed(true)} style={{ color: 'var(--gray)', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
        <X size={13} />
      </button>
    </div>
  )
}
