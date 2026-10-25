/**
 * Post-login return URLs (?next=). Only allowlisted origins (plus this auth
 * host itself) may be used — mirrors SSO backend CORS_ORIGINS to prevent open
 * redirects.
 */

const PRODUCTION_RETURN_ORIGINS = [
  'https://auth.karanparmar.in',
  'https://karanparmar.in',
  'https://www.karanparmar.in',
  'https://familyos.karanparmar.in',
  'https://studio.karanparmar.in',
]

const DEV_RETURN_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:5174',
  'http://localhost:4174',
  'http://localhost:5175',
  'http://localhost:4175',
  'http://localhost:1576',
  'http://localhost:1577',
  'http://localhost:3000',
]

function allowedOrigins(): string[] {
  const raw = import.meta.env.VITE_RETURN_ORIGINS
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw
      .split(',')
      .map((o: string) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean)
  }
  // Production builds never accept localhost return URLs.
  return import.meta.env.PROD
    ? PRODUCTION_RETURN_ORIGINS
    : [...PRODUCTION_RETURN_ORIGINS, ...DEV_RETURN_ORIGINS]
}

/**
 * Parse and validate a return URL from ?next=. Absolute URLs must be on an
 * allowlisted origin or on this auth host (e.g. /consent or
 * /api/auth/oauth/authorize). Same-origin paths ("/consent?…") are accepted.
 * Returns an absolute URL, or null if missing, malformed or not allowed.
 */
export function resolveReturnUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  let url: URL
  try {
    url = new URL(trimmed, window.location.origin)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  if (!url.hostname) return null

  if (url.origin !== window.location.origin && !allowedOrigins().includes(url.origin)) {
    return null
  }
  return url.toString()
}

/** `/login?next=<absolute current URL>` for sending the user to sign in. */
export function loginPathFor(href: string = window.location.href): string {
  return `/login?next=${encodeURIComponent(href)}`
}
