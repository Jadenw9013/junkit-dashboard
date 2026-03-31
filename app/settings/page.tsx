import { readSettings, getPreviousSettings } from '@/lib/settings'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const settings = await readSettings()
  const history = await getPreviousSettings()
  return <SettingsClient initialSettings={settings} initialHistory={history.slice(0, 5)} />
}
