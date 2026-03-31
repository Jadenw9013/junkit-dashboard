import fs from 'fs/promises'
import path from 'path'
import { Job } from './types'

const DATA_PATH = path.join(process.cwd(), 'data', 'jobs.json')

export async function readJobs(): Promise<Job[]> {
  try {
    const content = await fs.readFile(DATA_PATH, 'utf-8')
    if (!content.trim()) return []
    return JSON.parse(content) as Job[]
  } catch {
    return []
  }
}

export async function writeJobs(jobs: Job[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(jobs, null, 2), 'utf-8')
}

export async function addJob(
  job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Job> {
  const jobs = await readJobs()
  const now = new Date().toISOString()
  const newJob: Job = {
    ...job,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  jobs.push(newJob)
  await writeJobs(jobs)
  return newJob
}

export async function updateJob(
  id: string,
  updates: Partial<Job>
): Promise<Job | null> {
  const jobs = await readJobs()
  const index = jobs.findIndex((j) => j.id === id)
  if (index === -1) return null
  const updated: Job = {
    ...jobs[index],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  }
  jobs[index] = updated
  await writeJobs(jobs)
  return updated
}

export async function getRecentJobs(limit: number): Promise<Job[]> {
  const jobs = await readJobs()
  return jobs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}

export async function getJobsByStatus(status: import('./types').JobStatus): Promise<Job[]> {
  const jobs = await readJobs()
  return jobs
    .filter((j) => j.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getUnreadLeadCount(): Promise<number> {
  const jobs = await readJobs()
  return jobs.filter((j) => j.status === 'lead' && !j.aiDraftSMS).length
}
