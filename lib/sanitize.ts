/**
 * Input sanitization utilities for server actions.
 */

export function sanitizeText(input: string, maxLength: number): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, '')          // strip HTML tags
    .replace(/\n{3,}/g, '\n\n')       // max 2 consecutive newlines
    .slice(0, maxLength)
}

export function sanitizeName(input: string): string {
  return sanitizeText(input, 100)
}

export function sanitizePhone(phone: string): string {
  return phone
    .replace(/[^\d\s+()-]/g, '')      // only digits, spaces, +, parens, dashes
    .slice(0, 20)
}

export function sanitizePrice(input: unknown): number | undefined {
  if (input === null || input === undefined || input === '') return undefined
  const num = typeof input === 'number' ? input : parseFloat(String(input))
  if (isNaN(num) || num < 0) return undefined
  const capped = Math.min(num, 99999)
  return Math.round(capped * 100) / 100
}
