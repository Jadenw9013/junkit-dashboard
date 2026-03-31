'use server'

import { updateCustomer } from '@/lib/customers'

export async function updateCustomerNotes(
  id: string,
  notes: string,
  tags: string[]
): Promise<{ success: boolean }> {
  const result = await updateCustomer(id, { notes, tags })
  return { success: !!result }
}
