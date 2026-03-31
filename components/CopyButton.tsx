'use client'

import { useState, useId } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  text: string
  label?: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

export default function CopyButton({ text, label, size = 14, className = '', style }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const btnId = useId()

  function handleCopy() {
    try {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => fallbackCopy())
    } catch {
      fallbackCopy()
    }
  }

  function fallbackCopy() {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    try {
      document.execCommand('copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } finally {
      document.body.removeChild(textarea)
    }
  }

  return (
    <button
      id={btnId}
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 rounded transition-colors ${className}`}
      style={style}
    >
      {copied ? <Check size={size} /> : <Copy size={size} />}
      {label && <span className="text-xs">{copied ? 'Copied ✓' : label}</span>}
    </button>
  )
}
