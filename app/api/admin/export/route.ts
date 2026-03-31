import { NextRequest, NextResponse } from 'next/server'
import { storageGet, KEYS } from '@/lib/storage'

const validFiles: Record<string, typeof KEYS[keyof typeof KEYS]> = {
  audit: KEYS.AUDIT,
  feedback: KEYS.FEEDBACK,
  jobs: KEYS.JOBS,
  customers: KEYS.CUSTOMERS,
}

export async function GET(request: NextRequest) {
  const fileParam = request.nextUrl.searchParams.get('file')

  if (!fileParam || !validFiles[fileParam]) {
    return NextResponse.json({ error: 'Invalid file parameter' }, { status: 400 })
  }

  const key = validFiles[fileParam]
  const data = await storageGet(key, [])
  const content = JSON.stringify(data, null, 2)

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${fileParam}.json"`,
    },
  })
}
