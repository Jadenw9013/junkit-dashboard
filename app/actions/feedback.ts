'use server'

import { addFeedback } from '@/lib/feedback'

export async function submitFeedback(
  tool: string,
  rating: 'good' | 'bad',
  outputSummary: string,
  issue?: string
): Promise<void> {
  await addFeedback(tool, rating, outputSummary, issue)
}
