'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    if (typeof window !== 'undefined' && localStorage.getItem('junk-it-install-dismissed')) {
      setDismissed(true)
      return
    }

    // Android Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isIOS && !isStandalone) {
      setShowIOSPrompt(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setDismissed(true)
    setDeferredPrompt(null)
    setShowIOSPrompt(false)
    localStorage.setItem('junk-it-install-dismissed', '1')
  }

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  if (dismissed) return null
  if (!deferredPrompt && !showIOSPrompt) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
      style={{ maxWidth: '430px', margin: '0 auto' }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
      >
        {deferredPrompt ? (
          <>
            <Download size={18} style={{ color: '#F5C518', flexShrink: 0 }} />
            <p className="text-xs flex-1" style={{ color: '#2D2D2D' }}>Add to home screen for quick access</p>
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0"
              style={{ backgroundColor: '#F5C518', color: '#2D2D2D' }}
            >
              Install
            </button>
          </>
        ) : showIOSPrompt ? (
          <>
            <Share size={18} style={{ color: '#F5C518', flexShrink: 0 }} />
            <p className="text-xs flex-1" style={{ color: '#2D2D2D' }}>
              Tap <strong>Share</strong> then <strong>&ldquo;Add to Home Screen&rdquo;</strong>
            </p>
          </>
        ) : null}
        <button onClick={dismiss} className="p-1 shrink-0 rounded" style={{ color: '#6B7280' }}>
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
