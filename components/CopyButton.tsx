'use client'

import { useState, useRef } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  text: string
  label?: string
  size?: number
  className?: string
  style?: React.CSSProperties
  variant?: 'gold' | 'outline' | 'default'
}

export default function CopyButton({ text, label, size = 14, className = '', style, variant }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'selected'>('idle')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const variantStyles: React.CSSProperties = variant === 'gold'
    ? { backgroundColor: 'var(--gold-light)', color: 'var(--navy)', borderRadius: 'var(--r)', fontWeight: 700, padding: '0.375rem 0.75rem', border: 'none', fontSize: '0.8125rem' }
    : variant === 'outline'
    ? { backgroundColor: 'transparent', color: 'var(--navy)', borderRadius: 'var(--r)', fontWeight: 700, padding: '0.375rem 0.75rem', border: '1.5px solid var(--border-med)', fontSize: '0.8125rem' }
    : {}

  async function handleCopy() {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        setState('copied')
        setTimeout(() => setState('idle'), 2000)
        return
      } catch { /* fall through */ }
    }

    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.cssText = 'position:fixed;top:0;left:0;opacity:0;'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (success) {
        setState('copied')
        setTimeout(() => setState('idle'), 2000)
        return
      }
    } catch { /* fall through */ }

    setState('selected')
    setTimeout(() => setState('idle'), 4000)
  }

  const displayLabel = state === 'idle'
    ? (label || null)
    : state === 'copied'
    ? 'Copied ✓'
    : 'Text selected — long press to copy'

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleCopy}
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.15s', ...variantStyles, ...style }}
      >
        {state === 'copied' ? <Check size={size} /> : <Copy size={size} />}
        {displayLabel && <span>{displayLabel}</span>}
      </button>
      {state === 'selected' && (
        <textarea
          ref={textareaRef}
          readOnly
          value={text}
          style={{ position: 'absolute', opacity: 0.01, height: 1, pointerEvents: 'none' }}
        />
      )}
    </div>
  )
}
