import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Barlow } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const barlowCondensed = Barlow_Condensed({
  variable: '--font-barlow-condensed',
  subsets: ['latin'],
  weight: ['700', '800'],
})

const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'Junk It Dashboard',
  description: 'Owner dashboard for Junk It junk removal',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${barlowCondensed.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ backgroundColor: '#1a2535', color: '#f5f0e8' }}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
