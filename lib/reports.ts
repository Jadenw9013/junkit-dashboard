import { readJobs } from './jobs'
import { readCustomers } from './customers'
import { ServiceType, JobStatus } from './types'

export interface MonthlyReport {
  month: string
  year: number
  monthNum: number
  generatedAt: string

  summary: {
    totalJobs: number
    totalRevenue: number
    avgJobValue: number
    newCustomers: number
    returningCustomers: number
    leadsReceived: number
    leadsConverted: number
    conversionRate: number
  }

  byService: {
    service: ServiceType
    count: number
    revenue: number
  }[]

  byCity: {
    city: string
    count: number
    revenue: number
  }[]

  topCustomers: {
    name: string
    city: string
    jobs: number
    revenue: number
  }[]

  jobList: {
    date: string
    customerName: string
    city: string
    service: string
    price: number
    status: JobStatus
  }[]
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function emptyReport(year: number, month: number): MonthlyReport {
  return {
    month: `${MONTH_NAMES[month - 1]} ${year}`,
    year,
    monthNum: month,
    generatedAt: new Date().toISOString(),
    summary: {
      totalJobs: 0, totalRevenue: 0, avgJobValue: 0,
      newCustomers: 0, returningCustomers: 0,
      leadsReceived: 0,
      leadsConverted: 0, conversionRate: 0,
    },
    byService: [],
    byCity: [],
    topCustomers: [],
    jobList: [],
  }
}

export async function generateMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
  const allJobs = await readJobs()
  const allCustomers = await readCustomers()

  // Filter jobs for this month
  const monthJobs = allJobs.filter((j) => {
    const d = new Date(j.createdAt)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  })

  if (monthJobs.length === 0) return emptyReport(year, month)

  const totalRevenue = monthJobs.reduce((sum, j) => sum + (j.price ?? 0), 0)
  const jobsWithPrice = monthJobs.filter((j) => j.price != null && j.price > 0)
  const avgJobValue = jobsWithPrice.length > 0 ? Math.round(totalRevenue / jobsWithPrice.length) : 0

  const leads = monthJobs.filter((j) => j.status === 'lead')
  const completed = monthJobs.filter((j) => j.status === 'completed' || j.status === 'reviewed')

  // New vs returning customers this month
  const monthStart = new Date(year, month - 1, 1)
  const newCustomers = allCustomers.filter((c) => {
    const created = new Date(c.createdAt)
    return created.getFullYear() === year && created.getMonth() + 1 === month
  })
  const returningThisMonth = allCustomers.filter((c) => {
    const created = new Date(c.createdAt)
    return (created < monthStart) && c.jobs.some((jid) =>
      monthJobs.some((mj) => mj.id === jid)
    )
  })

  // Conversion rate: leads that became completed in this period
  const conversionRate = leads.length > 0
    ? Math.round((completed.length / (leads.length + completed.length)) * 100)
    : 0

  // By service
  const serviceMap = new Map<ServiceType, { count: number; revenue: number }>()
  for (const j of monthJobs) {
    const existing = serviceMap.get(j.service) || { count: 0, revenue: 0 }
    existing.count++
    existing.revenue += j.price ?? 0
    serviceMap.set(j.service, existing)
  }
  const byService = Array.from(serviceMap.entries()).map(([service, data]) => ({
    service, ...data,
  })).sort((a, b) => b.revenue - a.revenue)

  // By city
  const cityMap = new Map<string, { count: number; revenue: number }>()
  for (const j of monthJobs) {
    const city = j.city || 'Unknown'
    const existing = cityMap.get(city) || { count: 0, revenue: 0 }
    existing.count++
    existing.revenue += j.price ?? 0
    cityMap.set(city, existing)
  }
  const byCity = Array.from(cityMap.entries()).map(([city, data]) => ({
    city, ...data,
  })).sort((a, b) => b.count - a.count)

  // Top 5 customers by revenue this month
  const customerRevMap = new Map<string, { name: string; city: string; jobs: number; revenue: number }>()
  for (const j of monthJobs) {
    const key = j.phone || j.customerName
    const existing = customerRevMap.get(key) || { name: j.customerName, city: j.city, jobs: 0, revenue: 0 }
    existing.jobs++
    existing.revenue += j.price ?? 0
    customerRevMap.set(key, existing)
  }
  const topCustomers = Array.from(customerRevMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Full job list
  const jobList = monthJobs
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((j) => ({
      date: new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      customerName: j.customerName,
      city: j.city,
      service: j.service,
      price: j.price ?? 0,
      status: j.status,
    }))

  return {
    month: `${MONTH_NAMES[month - 1]} ${year}`,
    year,
    monthNum: month,
    generatedAt: new Date().toISOString(),
    summary: {
      totalJobs: monthJobs.length,
      totalRevenue,
      avgJobValue,
      newCustomers: newCustomers.length,
      returningCustomers: returningThisMonth.length,
      leadsReceived: leads.length,
      leadsConverted: completed.length,
      conversionRate,
    },
    byService,
    byCity,
    topCustomers,
    jobList,
  }
}
