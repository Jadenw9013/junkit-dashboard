import { FeedbackEntry } from './types'
import { storageGet, storageSet, KEYS } from './storage'

const MAX_ENTRIES = 200

export async function readFeedback(): Promise<FeedbackEntry[]> {
  return storageGet<FeedbackEntry[]>(KEYS.FEEDBACK, [])
}

export async function addFeedback(
  tool: string,
  rating: 'good' | 'bad',
  outputSummary: string,
  issue?: string
): Promise<void> {
  const entries = await readFeedback()
  const newEntry: FeedbackEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    tool,
    rating,
    outputSummary: outputSummary.slice(0, 200),
    issue,
  }
  entries.push(newEntry)
  const trimmed = entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries
  await storageSet(KEYS.FEEDBACK, trimmed)
}
