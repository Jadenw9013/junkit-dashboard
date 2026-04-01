'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const DISMISSED_KEY = 'welcome-dismissed'

export default function WelcomeCard() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(DISMISSED_KEY)) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--gold-border)',
      borderRadius: 'var(--r-lg)', padding: '1.25rem 1.375rem',
      marginBottom: '1.375rem', position: 'relative',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <button onClick={dismiss} style={{
        position: 'absolute', top: '0.75rem', right: '0.75rem',
        width: 26, height: 26, borderRadius: '50%',
        backgroundColor: 'var(--gray-light)', border: 'none',
        color: 'var(--gray)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}>
        <X size={13} />
      </button>

      <h3 style={{
        fontFamily: 'var(--font-barlow-condensed, sans-serif)', fontWeight: 800,
        fontSize: '1.125rem', color: 'var(--navy)', paddingRight: '2rem', marginBottom: '0.875rem',
      }}>
        You&apos;re all set — here&apos;s how to get started
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {[
          { emoji: '💬', text: <>Got an inquiry? <strong>Tap New Lead</strong> to draft a response in seconds</> },
          { emoji: '💰', text: <>Quoting a job? <strong>Tap Scope a Job</strong> to get a price on the spot</> },
          { emoji: '✅', text: <>Finished a job? <strong>Tap Job Done</strong> to keep your records</> },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-start' }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              backgroundColor: 'var(--gold-pale)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, flexShrink: 0,
            }}>{row.emoji}</div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gray)', lineHeight: 1.5 }}>
              {row.text}
            </span>
          </div>
        ))}
      </div>

      <button onClick={dismiss} style={{
        marginTop: '1rem', width: '100%',
        backgroundColor: 'var(--gold-light)', color: 'var(--navy)',
        borderRadius: 'var(--r)', border: 'none',
        padding: '0.5rem 0.75rem', fontSize: '0.8125rem', fontWeight: 700,
        cursor: 'pointer', transition: 'all 0.15s',
      }}>
        Got it — show me the dashboard
      </button>
    </div>
  )
}
