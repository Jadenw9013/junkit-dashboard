'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SidebarLogout() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <button onClick={handleLogout} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '0.5rem 0.625rem', borderRadius: 7,
      fontSize: '0.875rem', fontWeight: 500,
      color: 'var(--gray)', background: 'none', border: 'none',
      cursor: 'pointer', transition: 'all 0.15s', width: '100%',
    }}>
      <LogOut size={15} />
      <span>Log out</span>
    </button>
  )
}
