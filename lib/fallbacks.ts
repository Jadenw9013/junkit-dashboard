import type { QuoteResult } from '@/app/actions/scope'

const FALLBACKS = {
  lead: {
    sms: "Thanks for reaching out to Junk It! We'll review your request and get back to you within the hour with pricing. – Junk It",
    email:
      "Hi there,\n\nThank you for contacting Junk It! We've received your request and will follow up shortly with a quote.\n\nWe serve the greater Eastside and Snohomish area and typically have same-day availability.\n\nTalk soon,\nJunk It",
  },
  scope: {
    priceMin: 200,
    priceMax: 400,
    truckSize: 'half' as QuoteResult['truckSize'],
    timeEstimate: '1–2 hours',
    verbalQuote:
      "Based on what you've described, we're looking at $200 to $400 — let me get out there and take a look to give you an exact number.",
    flags: ['Contact owner for exact pricing'],
    confidence: 'low' as QuoteResult['confidence'],
  },
  reviewSMS:
    "Thanks so much for choosing Junk It! If you have a moment, we'd really appreciate a Google review — it means the world to us. – Junk It",
  message:
    "Hi! Just checking in from Junk It. Let us know if you need anything hauled — we have same-day availability most days.",
}

export function getFallback<T extends keyof typeof FALLBACKS>(tool: T): (typeof FALLBACKS)[T] {
  return FALLBACKS[tool]
}
