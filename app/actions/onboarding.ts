'use server'

import { readSettings, writeSettings } from '@/lib/settings'
import { redirect } from 'next/navigation'
import { Settings, PricingItem } from '@/lib/types'

export interface OnboardingData {
  businessName: string
  ownerName: string
  phone: string
  serviceArea: string[]
  pricing: PricingItem[]
  googleReviewLink: string
}

export async function completeOnboarding(data: OnboardingData): Promise<void> {
  const current = await readSettings()

  const updated: Settings = {
    ...current,
    businessName: data.businessName || current.businessName,
    ownerName: data.ownerName || current.ownerName,
    phone: data.phone || current.phone,
    serviceArea: data.serviceArea.length > 0 ? data.serviceArea : current.serviceArea,
    pricing: data.pricing.length > 0 ? data.pricing : current.pricing,
    googleReviewLink: data.googleReviewLink || current.googleReviewLink,
    onboardingComplete: true,
  }

  await writeSettings(updated)
  redirect('/')
}
