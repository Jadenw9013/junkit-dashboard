import { Customer, ServiceType, Job } from './types'
import { readJobs } from './jobs'
import { storageGet, storageSet, KEYS } from './storage'

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function readCustomers(): Promise<Customer[]> {
  return storageGet<Customer[]>(KEYS.CUSTOMERS, [])
}

export async function writeCustomers(customers: Customer[]): Promise<void> {
  await storageSet(KEYS.CUSTOMERS, customers)
}

export async function findCustomerByPhone(phone: string): Promise<Customer | null> {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  const customers = await readCustomers()
  return customers.find((c) => normalizePhone(c.phone) === normalized) ?? null
}

export async function upsertCustomer(jobData: {
  name: string
  phone: string
  city: string
  service: ServiceType
  price?: number
  jobId: string
}): Promise<{ customer: Customer; isNew: boolean }> {
  const customers = await readCustomers()
  const normalizedPhone = normalizePhone(jobData.phone)
  const now = new Date().toISOString()

  const existingIndex = customers.findIndex(
    (c) => normalizePhone(c.phone) === normalizedPhone && normalizedPhone.length > 0
  )

  if (existingIndex !== -1) {
    const existing = customers[existingIndex]
    const updated: Customer = {
      ...existing,
      updatedAt: now,
      name: jobData.name || existing.name,
      city: jobData.city || existing.city,
      totalJobs: existing.totalJobs + 1,
      totalRevenue: existing.totalRevenue + (jobData.price ?? 0),
      lastJobDate: now,
      lastJobService: jobData.service,
      jobs: [...existing.jobs, jobData.jobId],
    }
    customers[existingIndex] = updated
    await writeCustomers(customers)
    return { customer: updated, isNew: false }
  }

  const newCustomer: Customer = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    name: jobData.name,
    phone: jobData.phone,
    city: jobData.city,
    totalJobs: 1,
    totalRevenue: jobData.price ?? 0,
    lastJobDate: now,
    lastJobService: jobData.service,
    tags: [],
    notes: '',
    jobs: [jobData.jobId],
  }
  customers.push(newCustomer)
  await writeCustomers(customers)
  return { customer: newCustomer, isNew: true }
}

export async function getTopCustomers(limit: number): Promise<Customer[]> {
  const customers = await readCustomers()
  return customers
    .sort((a, b) => b.totalJobs - a.totalJobs)
    .slice(0, limit)
}

export async function getCustomerWithJobs(
  id: string
): Promise<{ customer: Customer; jobs: Job[] } | null> {
  const customers = await readCustomers()
  const customer = customers.find((c) => c.id === id)
  if (!customer) return null

  const allJobs = await readJobs()
  const customerJobs = allJobs.filter((j) => customer.jobs.includes(j.id))
  return { customer, jobs: customerJobs }
}

export async function updateCustomer(
  id: string,
  updates: Partial<Pick<Customer, 'notes' | 'tags'>>
): Promise<Customer | null> {
  const customers = await readCustomers()
  const index = customers.findIndex((c) => c.id === id)
  if (index === -1) return null

  const updated: Customer = {
    ...customers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  customers[index] = updated
  await writeCustomers(customers)
  return updated
}
