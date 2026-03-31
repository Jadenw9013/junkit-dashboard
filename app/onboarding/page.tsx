import { readSettings } from '@/lib/settings'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const settings = await readSettings()
  return <OnboardingClient initialSettings={settings} />
}
