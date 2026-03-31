import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  href: string
  label?: string
}

export default function BackButton({ href, label = 'Back' }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
      style={{ color: '#6B7280' }}
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </Link>
  )
}
