import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface BackButtonProps {
  href: string
  label?: string
}

export default function BackButton({ href, label = 'Back' }: BackButtonProps) {
  return (
    <Link
      href={href}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', fontWeight: 600, color: 'var(--gray)', textDecoration: 'none', transition: 'color 0.15s' }}
    >
      <ChevronLeft size={16} />
      <span>{label}</span>
    </Link>
  )
}
