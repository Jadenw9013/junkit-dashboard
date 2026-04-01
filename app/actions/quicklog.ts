'use server'

import { addJob } from '@/lib/jobs'
import { ServiceType } from '@/lib/types'

export async function quickLogJob(data: {
  customerName: string
  service: ServiceType
  city: string
}) {
  return addJob({
    customerName: data.customerName,
    phone: '',
    city: data.city,
    service: data.service,
    status: 'lead',
    source: 'manual',
  })
}
