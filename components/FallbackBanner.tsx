'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'

export default function FallbackBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div
      className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-4"
      style={{
        backgroundColor: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.3)',
      }}
    >
      <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: '#fcd34d' }} />
      <p className="text-xs flex-1" style={{ color: '#fcd34d' }}>
        AI unavailable — showing template response. Edit before sending.
      </p>
      <button onClick={() => setDismissed(true)} style={{ color: '#718096' }}>
        <X size={13} />
      </button>
    </div>
  )
}
