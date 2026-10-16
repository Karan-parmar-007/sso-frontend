import axios from 'axios'

export function getErrorMessage(err: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
    }
    if (!err.response) return 'Unable to reach the sign-in service'
  }
  if (err instanceof Error) return err.message
  return fallback
}

export function getErrorStatus(err: unknown): number | null {
  return axios.isAxiosError(err) ? (err.response?.status ?? null) : null
}

/** Machine-readable `code` from the error body, e.g. "email_not_verified". */
export function getErrorCode(err: unknown): string | null {
  if (!axios.isAxiosError(err)) return null
  const code = err.response?.data?.code
  return typeof code === 'string' ? code : null
}

/** Seconds from the Retry-After header of a 429, if present. */
export function getRetryAfterSeconds(err: unknown): number | null {
  if (!axios.isAxiosError(err)) return null
  const raw = err.response?.headers?.['retry-after']
  const seconds = Number(raw)
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}
