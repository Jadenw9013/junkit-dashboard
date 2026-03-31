'use server'

import { revalidatePath } from 'next/cache'
import { readSettings, writeSettings, getPreviousSettings } from '@/lib/settings'
import { PricingItem, Availability, SettingsSnapshot } from '@/lib/types'

export async function saveBusinessInfo(data: {
  businessName: string
  ownerName: string
  phone: string
  googleReviewLink: string
}) {
  const settings = await readSettings()
  await writeSettings({ ...settings, ...data })
  revalidatePath('/settings')
  revalidatePath('/')
}

export async function savePricing(items: PricingItem[]) {
  const settings = await readSettings()
  await writeSettings({ ...settings, pricing: items })
  revalidatePath('/settings')
}

export async function saveServiceArea(cities: string[]) {
  const settings = await readSettings()
  await writeSettings({ ...settings, serviceArea: cities })
  revalidatePath('/settings')
}

export async function saveItemLists(accepted: string[], refused: string[]) {
  const settings = await readSettings()
  await writeSettings({ ...settings, acceptedItems: accepted, refusedItems: refused })
  revalidatePath('/settings')
}

export async function saveAvailability(availability: Availability, businessHours: string) {
  const settings = await readSettings()
  await writeSettings({ ...settings, availability, businessHours })
  revalidatePath('/settings')
}

export async function saveAIStyle(
  tone: 'friendly' | 'formal' | 'casual',
  responseLength: 'brief' | 'standard' | 'detailed',
  includePricingInFirstResponse: boolean
) {
  const settings = await readSettings()
  await writeSettings({ ...settings, tone, responseLength, includePricingInFirstResponse })
  revalidatePath('/settings')
}

export async function loadSettingsHistory(): Promise<SettingsSnapshot[]> {
  return getPreviousSettings()
}

export async function restoreSettings(snapshot: SettingsSnapshot) {
  const current = await readSettings()
  // Write with incremented version to record this as a new save
  await writeSettings({
    ...snapshot.settings,
    version: current.version,
  })
  revalidatePath('/settings')
  revalidatePath('/')
}
