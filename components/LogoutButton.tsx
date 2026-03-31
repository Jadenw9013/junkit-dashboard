'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth', {
      method: 'DELETE',
    })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs px-3 py-1.5 rounded-lg transition-opacity active:opacity-70"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.08)',
        color: '#6B7280',
      }}
    >
      Logout
    </button>
  )
}
