import fs from 'fs/promises'
import path from 'path'
import { Settings, SettingsSnapshot } from './types'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')
const HISTORY_PATH = path.join(process.cwd(), 'data', 'settings-history.json')
const MAX_HISTORY = 20

export const DEFAULT_SETTINGS: Settings = {
  businessName: 'Junk It',
  ownerName: 'Owner',
  phone: '(425) 000-0000',
  googleReviewLink: 'https://g.page/r/YOUR_REVIEW_LINK',
  pricing: [
    { id: 'quarter', label: 'Quarter truck load', min: 100, max: 150, notes: '' },
    { id: 'half', label: 'Half truck load', min: 200, max: 280, notes: '' },
    { id: 'full', label: 'Full truck load', min: 380, max: 480, notes: '' },
    { id: 'demo', label: 'Light demolition', min: 250, max: 600, notes: 'Scope dependent' },
    { id: 'trailer', label: 'Trailer rental', min: 75, max: 120, notes: 'Per day' },
    { id: 'appliance', label: 'Appliance surcharge', min: 40, max: 60, notes: 'Per item' },
    { id: 'hottub', label: 'Hot tub surcharge', min: 75, max: 150, notes: '' },
  ],
  serviceArea: ['Bellevue', 'Kirkland', 'Redmond', 'Bothell', 'Snohomish', 'Woodinville', 'Kenmore', 'Everett'],
  acceptedItems: ['furniture', 'appliances', 'yard waste', 'construction debris', 'estate cleanouts', 'garage cleanouts', 'mattresses', 'hot tubs', 'electronics'],
  refusedItems: ['hazardous materials', 'paint', 'chemicals', 'propane tanks', 'tires'],
  availability: {
    monday: true, tuesday: true, wednesday: true,
    thursday: true, friday: true, saturday: true, sunday: false,
  },
  businessHours: '7am–6pm',
  tone: 'friendly',
  responseLength: 'standard',
  includePricingInFirstResponse: true,
  version: 1,
  updatedAt: '',
}

export async function readSettings(): Promise<Settings> {
  try {
    const content = await fs.readFile(SETTINGS_PATH, 'utf-8')
    if (!content.trim()) {
      await writeSettings(DEFAULT_SETTINGS)
      return DEFAULT_SETTINGS
    }
    return JSON.parse(content) as Settings
  } catch {
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
    return DEFAULT_SETTINGS
  }
}

export async function writeSettings(settings: Settings): Promise<void> {
  // Snapshot current settings to history
  try {
    const current = await readCurrentRaw()
    if (current) {
      const history = await readHistory()
      history.unshift({ settings: current, savedAt: new Date().toISOString() })
      const trimmed = history.slice(0, MAX_HISTORY)
      await fs.writeFile(HISTORY_PATH, JSON.stringify(trimmed, null, 2), 'utf-8')
    }
  } catch {
    // Don't fail the write if history fails
  }

  const updated: Settings = {
    ...settings,
    version: (settings.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8')
}

async function readCurrentRaw(): Promise<Settings | null> {
  try {
    const content = await fs.readFile(SETTINGS_PATH, 'utf-8')
    if (!content.trim()) return null
    return JSON.parse(content) as Settings
  } catch {
    return null
  }
}

async function readHistory(): Promise<SettingsSnapshot[]> {
  try {
    const content = await fs.readFile(HISTORY_PATH, 'utf-8')
    if (!content.trim()) return []
    return JSON.parse(content) as SettingsSnapshot[]
  } catch {
    return []
  }
}

export async function getPreviousSettings(): Promise<SettingsSnapshot[]> {
  const history = await readHistory()
  return history.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
}

export function buildBusinessContext(settings: Settings): string {
  const availDays = Object.entries(settings.availability)
    .filter(([, v]) => v)
    .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
    .join(', ')

  const pricingLines = settings.pricing
    .map((p) => `  ${p.label}: $${p.min}–$${p.max}${p.notes ? ` (${p.notes})` : ''}`)
    .join('\n')

  const pricingNote = settings.includePricingInFirstResponse
    ? 'yes — include price range in first response'
    : 'no — direct customers to call for pricing'

  return `BUSINESS CONTEXT:
Business: ${settings.businessName}
Owner: ${settings.ownerName}
Phone: ${settings.phone}
Service area: ${settings.serviceArea.join(', ')}
Business hours: ${settings.businessHours}
Available days: ${availDays}

PRICING:
${pricingLines}

ACCEPTED ITEMS: ${settings.acceptedItems.join(', ')}
REFUSED ITEMS: ${settings.refusedItems.join(', ')}

TONE: ${settings.tone}. Response length: ${settings.responseLength}.
Include pricing in first response: ${pricingNote}`
}
