import { readCustomers } from '@/lib/customers'
import CustomersClient from './CustomersClient'

export default async function CustomersPage() {
  const customers = await readCustomers()
  return <CustomersClient customers={customers} />
}
