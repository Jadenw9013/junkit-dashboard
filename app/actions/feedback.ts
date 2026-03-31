'use server'

import fs from 'fs/promises'
import path from 'path'
import { FeedbackEntry } from '@/lib/types'

const FEEDBACK_PATH = path.join(process.cwd(), 'data', 'feedback.json')
const MAX_ENTRIES = 200

async function readFeedback(): Promise<FeedbackEntry[]> {
  try {
    const content = await fs.readFile(FEEDBACK_PATH, 'utf-8')
    if (!content.trim()) return []
    return JSON.parse(content) as FeedbackEntry[]
  } catch {
    return []
  }
}

export async function submitFeedback(
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
  await fs.writeFile(FEEDBACK_PATH, JSON.stringify(trimmed, null, 2), 'utf-8')
}
