import { Settings, SettingsSnapshot } from './types'
import { storageGet, storageSet, KEYS } from './storage'

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
  onboardingComplete: false,
  version: 1,
  updatedAt: '',
}

export async function readSettings(): Promise<Settings> {
  const settings = await storageGet<Settings | null>(KEYS.SETTINGS, null)
  if (!settings) {
    await writeSettings(DEFAULT_SETTINGS)
    return DEFAULT_SETTINGS
  }
  return settings
}

export async function writeSettings(settings: Settings): Promise<void> {
  // Snapshot current settings to history
  try {
    const current = await storageGet<Settings | null>(KEYS.SETTINGS, null)
    if (current) {
      const history = await storageGet<SettingsSnapshot[]>(KEYS.SETTINGS_HISTORY, [])
      history.unshift({ settings: current, savedAt: new Date().toISOString() })
      const trimmed = history.slice(0, MAX_HISTORY)
      await storageSet(KEYS.SETTINGS_HISTORY, trimmed)
    }
  } catch {
    // Don't fail the write if history fails
  }

  const updated: Settings = {
    ...settings,
    version: (settings.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  }
  await storageSet(KEYS.SETTINGS, updated)
}

export async function getPreviousSettings(): Promise<SettingsSnapshot[]> {
  const history = await storageGet<SettingsSnapshot[]>(KEYS.SETTINGS_HISTORY, [])
  return history.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
}

export function validateSettings(settings: Partial<Settings>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (settings.businessName !== undefined) {
    if (!settings.businessName.trim()) errors.push('Business name is required')
    if (settings.businessName.length > 100) errors.push('Business name must be under 100 characters')
  }

  if (settings.phone !== undefined && settings.phone.trim()) {
    const phoneDigits = settings.phone.replace(/\D/g, '')
    if (phoneDigits.length < 7 || phoneDigits.length > 15) errors.push('Phone number looks invalid')
  }

  if (settings.googleReviewLink !== undefined && settings.googleReviewLink.trim()) {
    if (!settings.googleReviewLink.startsWith('https://')) errors.push('Google review link must start with https://')
  }

  if (settings.pricing) {
    for (const item of settings.pricing) {
      if (item.min < 0) errors.push(`${item.label}: minimum price cannot be negative`)
      if (item.max < item.min) errors.push(`${item.label}: maximum must be greater than minimum`)
      if (item.max > 9999) errors.push(`${item.label}: maximum cannot exceed $9,999`)
    }
  }

  if (settings.serviceArea) {
    if (settings.serviceArea.length === 0) errors.push('At least one city required in service area')
    if (settings.serviceArea.length > 50) errors.push('Service area cannot have more than 50 cities')
  }

  if (settings.acceptedItems && settings.acceptedItems.length > 100) {
    errors.push('Accepted items list cannot exceed 100 items')
  }

  if (settings.refusedItems && settings.refusedItems.length > 100) {
    errors.push('Refused items list cannot exceed 100 items')
  }

  if (settings.businessHours && settings.businessHours.length > 50) {
    errors.push('Business hours must be under 50 characters')
  }

  return { valid: errors.length === 0, errors }
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
