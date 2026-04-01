'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    setIsOffline(!navigator.onLine)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: '#B45309', color: '#FFFFFF',
      padding: '9px 16px',
      fontSize: '0.8125rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    }}>
      <WifiOff size={15} />
      No internet connection — reconnect to use AI features
    </div>
  )
}
