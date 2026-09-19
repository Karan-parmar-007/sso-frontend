/**
 * Post-login return URLs (?next=). Only allowlisted origins may be used —
 * mirrors SSO backend CORS_ORIGINS to prevent open redirects.
 */

const DEFAULT_RETURN_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:5174',
  'http://localhost:4174',
  'http://localhost:5175',
  'http://localhost:4175',
  'http://localhost:1576',
  'http://localhost:1577',
  'http://localhost:3000',
  'https://auth.karanparmar.in',
  'https://karanparmar.in',
  'https://www.karanparmar.in',
  'https://familyos.karanparmar.in',
  'https://app.karanparmar.in',
]

function allowedOrigins(): string[] {
  const raw = import.meta.env.VITE_RETURN_ORIGINS
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw
      .split(',')
      .map((o: string) => o.trim())
      .filter(Boolean)
  }
  return DEFAULT_RETURN_ORIGINS
}

/**
 * Parse and validate an absolute return URL from ?next=.
 * Returns null if missing, malformed, or not on an allowlisted origin.
 */
export function resolveReturnUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  // Reject protocol-relative and weird host forms
  if (!url.hostname) return null

  if (!allowedOrigins().includes(url.origin)) return null
  return url.toString()
}
