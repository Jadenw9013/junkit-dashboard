'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Users } from 'lucide-react'
import { Customer } from '@/lib/types'
import BackButton from '@/components/BackButton'

const serviceLabels: Record<string, string> = {
  'junk-removal': 'Junk Removal',
  'demolition': 'Demolition',
  'trailer-rental': 'Trailer Rental',
  'unknown': 'Other',
}

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
    )
  }, [customers, search])

  const totalCustomers = customers.length
  const repeatCustomers = customers.filter((c) => c.totalJobs > 1).length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalRevenue, 0)
  const avgRevenue = totalCustomers > 0
    ? Math.round(totalRevenue / customers.reduce((sum, c) => sum + c.totalJobs, 0) || 0)
    : 0

  const stats = [
    { label: 'Total Customers', value: totalCustomers },
    { label: 'Repeat Customers', value: repeatCustomers },
    { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}` },
    { label: 'Avg / Job', value: `$${avgRevenue.toLocaleString()}` },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a2535' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        <div className="flex items-center gap-3 py-5">
          <BackButton href="/" />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#f5f0e8' }}>Customers</h1>
            <p className="text-xs" style={{ color: '#718096' }}>Your customer history — built automatically from logged jobs.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#243044', border: '1px solid rgba(184,150,74,0.2)' }}>
              <p className="text-lg font-bold" style={{ color: '#b8964a' }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#718096' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#718096' }} />
          <input
            type="text"
            placeholder="Search by name, phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#243044', border: '1px solid rgba(184,150,74,0.3)', color: '#f5f0e8' }}
          />
        </div>

        {/* Customer List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12">
            {customers.length === 0 ? (
              <>
                <Users size={40} style={{ color: '#718096' }} className="mb-3" />
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#f5f0e8' }}>No customers yet</h3>
                <p className="text-xs max-w-[260px] mb-4" style={{ color: '#718096' }}>
                  Customers are created automatically when you log a completed job using the Job Done tool.
                </p>
                <Link href="/jobdone" className="px-5 py-2.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#b8964a', color: '#1a2535' }}>
                  Log your first job →
                </Link>
              </>
            ) : (
              <p className="text-sm" style={{ color: '#718096' }}>No customers match your search.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((c) => (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="block rounded-xl p-4 transition-opacity active:opacity-80"
                style={{ backgroundColor: '#243044', border: '1px solid rgba(184,150,74,0.2)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#f5f0e8' }}>{c.name}</p>
                    <p className="text-xs" style={{ color: '#718096' }}>{c.city} · {c.phone}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(184,150,74,0.12)', color: '#d4ae6a' }}>
                        {serviceLabels[c.lastJobService] || c.lastJobService}
                      </span>
                      {c.tags.map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: '#718096' }}>
                      Last: {new Date(c.lastJobDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(184,150,74,0.15)', color: '#b8964a' }}>
                      {c.totalJobs} job{c.totalJobs !== 1 ? 's' : ''}
                    </span>
                    <p className="text-xs font-medium mt-1" style={{ color: '#4ade80' }}>
                      ${c.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
