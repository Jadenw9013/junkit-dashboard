'use server'

import { readJobs, updateJob } from '@/lib/jobs'
import { Job, JobStatus } from '@/lib/types'

export async function getInboxLeads(): Promise<Job[]> {
  const jobs = await readJobs()
  return jobs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function updateLeadStatus(
  id: string,
  status: JobStatus
): Promise<{ success: boolean }> {
  const updated = await updateJob(id, { status })
  return { success: !!updated }
}

export async function archiveLead(id: string): Promise<{ success: boolean }> {
  const updated = await updateJob(id, { status: 'reviewed' })
  return { success: !!updated }
}
