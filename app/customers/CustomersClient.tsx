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
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F1' }}>
      <div className="mx-auto max-w-[430px] px-4 pb-8">
        <div className="flex items-center gap-3 py-5">
          <BackButton href="/" />
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#2D2D2D' }}>Customers</h1>
            <p className="text-xs" style={{ color: '#6B7280' }}>Your customer history — built automatically from logged jobs.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.2)' }}>
              <p className="text-lg font-bold" style={{ color: '#F5C518' }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
          <input
            type="text"
            placeholder="Search by name, phone, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.3)', color: '#2D2D2D' }}
          />
        </div>

        {/* Customer List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12">
            {customers.length === 0 ? (
              <>
                <Users size={40} style={{ color: '#6B7280' }} className="mb-3" />
                <h3 className="text-sm font-semibold mb-1" style={{ color: '#2D2D2D' }}>No customers yet</h3>
                <p className="text-xs max-w-[260px] mb-4" style={{ color: '#6B7280' }}>
                  Customers are created automatically when you log a completed job using the Job Done tool.
                </p>
                <Link href="/jobdone" className="px-5 py-2.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: '#F5C518', color: '#F7F6F1' }}>
                  Log your first job →
                </Link>
              </>
            ) : (
              <p className="text-sm" style={{ color: '#6B7280' }}>No customers match your search.</p>
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
                style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(0,0,0,0.2)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: '#2D2D2D' }}>{c.name}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{c.city} · {c.phone}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.12)', color: '#E0B115' }}>
                        {serviceLabels[c.lastJobService] || c.lastJobService}
                      </span>
                      {c.tags.map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: '#6B7280' }}>
                      Last: {new Date(c.lastJobDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#F5C518' }}>
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
