'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { submitFeedback } from '@/app/actions/feedback'

interface FeedbackWidgetProps {
  tool: string
  outputSummary: string
}

export default function FeedbackWidget({ tool, outputSummary }: FeedbackWidgetProps) {
  const [state, setState] = useState<'idle' | 'bad-input' | 'done'>('idle')
  const [issue, setIssue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleGood() {
    await submitFeedback(tool, 'good', outputSummary)
    setState('done')
  }

  async function handleBadSubmit() {
    setSubmitting(true)
    await submitFeedback(tool, 'bad', outputSummary, issue || undefined)
    setState('done')
    setSubmitting(false)
  }

  if (state === 'done') {
    return (
      <p className="text-xs text-center py-1" style={{ color: '#718096' }}>
        Thanks for the feedback
      </p>
    )
  }

  return (
    <div className="text-center">
      {state === 'idle' && (
        <div className="flex items-center justify-center gap-3">
          <span className="text-xs" style={{ color: '#718096' }}>
            Was this helpful?
          </span>
          <button
            onClick={handleGood}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80' }}
            aria-label="Good response"
          >
            <ThumbsUp size={13} />
          </button>
          <button
            onClick={() => setState('bad-input')}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: '#f87171' }}
            aria-label="Bad response"
          >
            <ThumbsDown size={13} />
          </button>
        </div>
      )}

      {state === 'bad-input' && (
        <div className="flex flex-col gap-2 mt-1">
          <input
            type="text"
            placeholder="What was wrong? (optional)"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-xs outline-none"
            style={{
              backgroundColor: '#1a2535',
              border: '1px solid rgba(184,150,74,0.2)',
              color: '#f5f0e8',
            }}
          />
          <button
            onClick={handleBadSubmit}
            disabled={submitting}
            className="text-xs py-1.5 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: 'rgba(184,150,74,0.1)', color: '#b8964a' }}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  )
}
