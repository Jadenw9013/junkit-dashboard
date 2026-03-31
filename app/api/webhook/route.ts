import { NextRequest, NextResponse } from 'next/server'
import { addJob } from '@/lib/jobs'
import { ServiceType } from '@/lib/types'

// In-memory rate limiting (resets on server restart)
const ipRequestCounts = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT = 20
const WINDOW_MS = 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = ipRequestCounts.get(ip)

  if (!record || now - record.windowStart > WINDOW_MS) {
    ipRequestCounts.set(ip, { count: 1, windowStart: now })
    return true
  }

  if (record.count >= RATE_LIMIT) return false
  record.count += 1
  return true
}

export async function POST(request: NextRequest) {
  // Request size limit
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  // Webhook secret validation
  const secret = request.headers.get('x-webhook-secret')
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Timestamp validation (replay attack protection)
  const timestampHeader = request.headers.get('x-timestamp')
  if (!timestampHeader) {
    return NextResponse.json({ error: 'Missing timestamp' }, { status: 400 })
  }
  const timestamp = parseInt(timestampHeader, 10)
  if (isNaN(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) {
    return NextResponse.json({ error: 'Request expired' }, { status: 401 })
  }

  // IP rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const body = await request.json()
  const { customerName, phone, service, city, description } = body

  const job = await addJob({
    customerName: customerName ?? 'Unknown',
    phone: phone ?? '',
    service: (service as ServiceType) ?? 'unknown',
    city: city ?? '',
    notes: description ?? '',
    status: 'lead',
  })

  return NextResponse.json({ success: true, jobId: job.id })
}
