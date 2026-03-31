// Edge-runtime safe. NO fs/path/process imports. Only crypto.subtle.

const TOKEN_SEP = '.'

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return Buffer.from(sig).toString('base64url')
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret)
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  return diff === 0
}

export async function createSignedToken(id: string, expiresAt: number): Promise<string> {
  const secret = process.env.DASHBOARD_PASSWORD ?? 'fallback'
  const payload = `${id}|${expiresAt}`
  const sig = await hmacSign(payload, secret)
  return `${Buffer.from(payload).toString('base64url')}${TOKEN_SEP}${sig}`
}

export async function validateSessionEdge(token: string): Promise<boolean> {
  if (!token) return false
  const lastDot = token.lastIndexOf(TOKEN_SEP)
  if (lastDot === -1) return false
  const payloadB64 = token.slice(0, lastDot)
  const sig = token.slice(lastDot + 1)
  try {
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf-8')
    const secret = process.env.DASHBOARD_PASSWORD ?? 'fallback'
    const valid = await hmacVerify(payload, sig, secret)
    if (!valid) return false
    const parts = payload.split('|')
    if (parts.length < 2) return false
    return Date.now() < parseInt(parts[1], 10)
  } catch {
    return false
  }
}
