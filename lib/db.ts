import { Job, Customer, AutomationLogEntry } from './types'
import { isSupabaseAvailable, getSupabase } from './supabase'
import { readJobs } from './jobs'
import { readCustomers } from './customers'
import { storageAppend, storageGet, KEYS } from './storage'
import { differenceInDays, differenceInMonths, subDays, subMonths } from 'date-fns'

/**
 * Get leads that are older than `daysOld` and never converted.
 */
export async function getUnconvertedLeads(daysOld: number): Promise<Job[]> {
  if (isSupabaseAvailable()) {
    try {
      const cutoff = subDays(new Date(), daysOld).toISOString()
      const { data, error } = await getSupabase()
        .from('jobs')
        .select('*')
        .eq('status', 'lead')
        .lt('created_at', cutoff)
      if (error) throw error
      return (data ?? []).map(mapSupabaseJob)
    } catch (e) {
      console.warn('[DB] Supabase getUnconvertedLeads failed, falling back to KV:', e)
    }
  }

  // KV fallback
  const jobs = await readJobs()
  const cutoff = subDays(new Date(), daysOld)
  return jobs.filter(
    (j) => j.status === 'lead' && new Date(j.createdAt) < cutoff
  )
}

/**
 * Get customers with no activity in `monthsOld` months.
 */
export async function getDormantCustomers(monthsOld: number): Promise<Customer[]> {
  if (isSupabaseAvailable()) {
    try {
      const cutoff = subMonths(new Date(), monthsOld).toISOString()
      const { data, error } = await getSupabase()
        .from('customers')
        .select('*')
        .lt('last_job_date', cutoff)
        .gt('total_jobs', 0)
      if (error) throw error
      return (data ?? []).map(mapSupabaseCustomer)
    } catch (e) {
      console.warn('[DB] Supabase getDormantCustomers failed, falling back to KV:', e)
    }
  }

  // KV fallback
  const customers = await readCustomers()
  const cutoff = subMonths(new Date(), monthsOld)
  return customers.filter(
    (c) => c.totalJobs > 0 && new Date(c.lastJobDate) < cutoff
  )
}

/**
 * Get the date of the most recent lead.
 */
export async function getLastLeadDate(): Promise<Date | null> {
  if (isSupabaseAvailable()) {
    try {
      const { data, error } = await getSupabase()
        .from('jobs')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
      if (error) throw error
      if (data && data.length > 0) return new Date(data[0].created_at)
      return null
    } catch (e) {
      console.warn('[DB] Supabase getLastLeadDate failed, falling back to KV:', e)
    }
  }

  // KV fallback
  const jobs = await readJobs()
  if (jobs.length === 0) return null
  const sorted = jobs.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return new Date(sorted[0].createdAt)
}

/**
 * Save an automation log entry.
 */
export async function saveAutomationLog(entry: AutomationLogEntry): Promise<void> {
  if (isSupabaseAvailable()) {
    try {
      const { error } = await getSupabase().from('automation_logs').insert({
        id: entry.id,
        timestamp: entry.timestamp,
        trigger: entry.trigger,
        action: entry.action,
        recipient: entry.recipient,
        success: entry.success,
        fallback_used: entry.fallbackUsed,
        error: entry.error,
        job_id: entry.jobId,
        customer_id: entry.customerId,
      })
      if (error) throw error
      return
    } catch (e) {
      console.warn('[DB] Supabase saveAutomationLog failed, falling back to KV:', e)
    }
  }

  // KV fallback
  await storageAppend('automation-logs' as Parameters<typeof storageAppend>[0], entry, 500)
}

/**
 * Get recent automation log entries.
 */
export async function getAutomationLogs(limit: number): Promise<AutomationLogEntry[]> {
  if (isSupabaseAvailable()) {
    try {
      const { data, error } = await getSupabase()
        .from('automation_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []).map(mapSupabaseAutomationLog)
    } catch (e) {
      console.warn('[DB] Supabase getAutomationLogs failed, falling back to KV:', e)
    }
  }

  // KV fallback
  const logs = await storageGet<AutomationLogEntry[]>('automation-logs' as Parameters<typeof storageGet>[0], [])
  return logs.slice(-limit).reverse()
}

// — Mappers —

function mapSupabaseJob(row: Record<string, unknown>): Job {
  return {
    id: String(row.id ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
    customerName: String(row.customer_name ?? ''),
    phone: String(row.phone ?? ''),
    service: (row.service as Job['service']) ?? 'unknown',
    city: String(row.city ?? ''),
    price: row.price != null ? Number(row.price) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    status: (row.status as Job['status']) ?? 'lead',
    aiDraftSMS: row.ai_draft_sms ? String(row.ai_draft_sms) : undefined,
    aiDraftEmail: row.ai_draft_email ? String(row.ai_draft_email) : undefined,
    source: (row.source as Job['source']) ?? 'manual',
  }
}

function mapSupabaseCustomer(row: Record<string, unknown>): Customer {
  return {
    id: String(row.id ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
    name: String(row.name ?? ''),
    phone: String(row.phone ?? ''),
    city: String(row.city ?? ''),
    totalJobs: Number(row.total_jobs ?? 0),
    totalRevenue: Number(row.total_revenue ?? 0),
    lastJobDate: String(row.last_job_date ?? ''),
    lastJobService: (row.last_job_service as Customer['lastJobService']) ?? 'unknown',
    tags: Array.isArray(row.tags) ? row.tags as string[] : [],
    notes: String(row.notes ?? ''),
    jobs: [], // Supabase doesn't store job IDs array directly
  }
}

function mapSupabaseAutomationLog(row: Record<string, unknown>): AutomationLogEntry {
  return {
    id: String(row.id ?? ''),
    timestamp: String(row.timestamp ?? ''),
    trigger: String(row.trigger ?? ''),
    action: String(row.action ?? ''),
    recipient: row.recipient ? String(row.recipient) : undefined,
    success: Boolean(row.success),
    fallbackUsed: Boolean(row.fallback_used),
    error: row.error ? String(row.error) : undefined,
    jobId: row.job_id ? String(row.job_id) : undefined,
    customerId: row.customer_id ? String(row.customer_id) : undefined,
  }
}
