'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check } from 'lucide-react'

const envBlock = `JUNKIT_DASHBOARD_WEBHOOK_URL=https://your-dashboard-url/api/webhook
JUNKIT_WEBHOOK_SECRET=          ← replace with your WEBHOOK_SECRET value`

const serverActionCode = `// Add to the end of your contact form server action
// after the email send succeeds

async function notifyDashboard(formData: {
  customerName: string
  phone: string
  service: string
  zip: string
  city: string
  description: string
}) {
  const webhookUrl = process.env.JUNKIT_DASHBOARD_WEBHOOK_URL
  const secret = process.env.JUNKIT_WEBHOOK_SECRET
  if (!webhookUrl || !secret) return

  const timestamp = Math.floor(Date.now() / 1000).toString()

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
        'x-timestamp': timestamp,
      },
      body: JSON.stringify({
        ...formData,
        timestamp,
      }),
    })
  } catch (e) {
    // fail silently — don't break the form if dashboard is down
    console.error('Dashboard webhook failed:', e)
  }
}`

const callCode = `// In your form server action, after successful email send:
await notifyDashboard({
  customerName: formData.get('name') as string,
  phone: formData.get('phone') as string,
  service: formData.get('service') as string,
  zip: formData.get('zip') as string,
  city: '',   // extract from zip or leave blank
  description: formData.get('description') as string,
})`

function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs whitespace-pre-wrap font-mono overflow-x-auto" style={{ color: '#374151' }}>
        {code}
      </pre>
    </div>
  )
}

export default function WebhookSetupPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Webhook Setup</h1>
            <p className="text-sm text-gray-500">Add this code to the public Junk It website&apos;s contact form server action.</p>
          </div>
        </div>

        <CodeBlock
          label="1. Environment variables to add to public site"
          code={envBlock}
        />

        <CodeBlock
          label="2. Server action snippet (TypeScript)"
          code={serverActionCode}
        />

        <CodeBlock
          label="3. Where to call it"
          code={callCode}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-2">Integration Notes</p>
          <ul className="space-y-1 text-xs">
            <li>• The dashboard webhook endpoint: <code className="bg-blue-100 px-1 rounded">POST /api/webhook</code></li>
            <li>• Required headers: <code className="bg-blue-100 px-1 rounded">x-webhook-secret</code>, <code className="bg-blue-100 px-1 rounded">x-timestamp</code></li>
            <li>• Timestamp must be within 300 seconds of server time.</li>
            <li>• Failed webhooks are silent — they never break the public form.</li>
          </ul>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900 mt-6">
          <p className="font-semibold mb-2">Storage Setup (Required for Production)</p>
          <p className="text-xs mb-3">The dashboard uses Redis for persistent data storage in production. Without this, all data resets on every deployment.</p>
          <ol className="space-y-1.5 text-xs list-decimal list-inside">
            <li>Provision a Redis instance (Redis Cloud, Upstash, or any provider)</li>
            <li>Add <code className="bg-emerald-100 px-1 rounded">REDIS_URL</code> to your Vercel project environment variables</li>
            <li>Format: <code className="bg-emerald-100 px-1 rounded">redis://default:PASSWORD@HOST:PORT</code></li>
            <li>Redeploy the project</li>
            <li>Hit <code className="bg-emerald-100 px-1 rounded">GET /api/init</code> with header <code className="bg-emerald-100 px-1 rounded">x-developer-secret</code> to seed initial data</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
