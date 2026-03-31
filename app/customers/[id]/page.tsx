import { notFound } from 'next/navigation'
import { getCustomerWithJobs } from '@/lib/customers'
import CustomerDetailClient from './CustomerDetailClient'

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getCustomerWithJobs(id)
  if (!result) notFound()

  return <CustomerDetailClient customer={result.customer} jobs={result.jobs} />
}
