'use server'

import { revalidatePath } from 'next/cache'
import { updateJob } from '@/lib/jobs'
import { JobStatus } from '@/lib/types'

export async function markJobStatus(id: string, status: JobStatus) {
  const job = await updateJob(id, { status })
  revalidatePath('/')
  return job
}
