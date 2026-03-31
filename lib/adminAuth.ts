export function validateAdminToken(token: string | undefined): boolean {
  const secret = process.env.DEVELOPER_SECRET
  if (!secret) return false
  return token === secret
}
