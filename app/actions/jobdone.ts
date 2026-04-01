'use server'

import { addJob } from '@/lib/jobs'
import { Job, ServiceType } from '@/lib/types'
import { upsertCustomer } from '@/lib/customers'
import { sanitizeName, sanitizePhone, sanitizeText, sanitizePrice } from '@/lib/sanitize'

export interface JobDoneInput {
  customerName: string
  phone: string
  city: string
  service: ServiceType
  price: number
  notes?: string
}

export async function logJob(
  input: JobDoneInput
): Promise<{ job: Job; isNewCustomer?: boolean }> {
  const cleanInput: JobDoneInput = {
    customerName: sanitizeName(input.customerName),
    phone: sanitizePhone(input.phone),
    city: sanitizeName(input.city),
    service: input.service,
    price: sanitizePrice(input.price) ?? 0,
    notes: input.notes ? sanitizeText(input.notes, 2000) : undefined,
  }

  const job = await addJob({
    customerName: cleanInput.customerName,
    phone: cleanInput.phone,
    city: cleanInput.city,
    service: cleanInput.service,
    price: cleanInput.price,
    notes: cleanInput.notes,
    status: 'completed',
    source: 'manual',
  })

  const { isNew: isNewCustomer } = await upsertCustomer({
    name: cleanInput.customerName,
    phone: cleanInput.phone,
    city: cleanInput.city,
    service: cleanInput.service,
    price: cleanInput.price,
    jobId: job.id,
  })

  return { job, isNewCustomer }
}
