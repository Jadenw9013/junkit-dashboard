import { NextRequest, NextResponse } from 'next/server'
import { sendOwnerAlert } from '@/lib/sms'
import { saveAutomationLog } from '@/lib/db'
import { readJobs } from '@/lib/jobs'
import { readCustomers } from '@/lib/customers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Telnyx sends: data.payload.from.phone_number, data.payload.text, etc.
    const payload = body?.data?.payload ?? body
    const from = payload?.from?.phone_number ?? payload?.from ?? ''
    const text = payload?.text ?? payload?.body ?? ''

    if (!from || !text) {
      return NextResponse.json({ error: 'Missing from or text' }, { status: 400 })
    }

    // Find customer by phone
    const customers = await readCustomers()
    const normalizedFrom = from.replace(/\D/g, '')
    const customer = customers.find(
      (c) => c.phone.replace(/\D/g, '') === normalizedFrom
    )

    const customerName = customer?.name ?? 'Unknown'

    // Find any existing job for this phone
    const jobs = await readJobs()
    const relatedJob = jobs.find(
      (j) => j.phone.replace(/\D/g, '') === normalizedFrom
    )

    // Forward to owner
    await sendOwnerAlert(
      `Customer reply from ${from}:\n"${text}"\nCustomer: ${customerName}${relatedJob ? ` (${relatedJob.city}, ${relatedJob.service})` : ''}`
    )

    // Log
    await saveAutomationLog({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      trigger: 'sms_reply',
      action: `Customer ${customerName} replied: "${text.slice(0, 80)}"`,
      recipient: from.slice(-4),
      success: true,
      fallbackUsed: false,
      jobId: relatedJob?.id,
      customerId: customer?.id,
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[SMS WEBHOOK] Error:', err)
    return NextResponse.json({ received: true })
  }
}
