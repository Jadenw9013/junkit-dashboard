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
        backgroundColor: 'rgba(184,150,74,0.1)',
        border: '1px solid rgba(184,150,74,0.3)',
        color: '#718096',
      }}
    >
      Logout
    </button>
  )
}
