import axios from 'axios'

export function getErrorMessage(err: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((d) => d.msg || JSON.stringify(d)).join(', ')
    }
  }
  if (err instanceof Error) return err.message
  return fallback
}
