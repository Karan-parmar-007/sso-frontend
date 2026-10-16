import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { createSsoClient, readCsrfToken } from '@/lib/sso/sso-client'

const API_URL = (
  (window as Window & { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api/auth'
).replace(/\/+$/, '')

/**
 * Browser SSO SDK. It talks to `${apiBase}/api/auth/*`, so derive the base
 * from API_URL ('/api/auth' in prod → same origin; an absolute dev URL such
 * as http://localhost:8000/api/auth → http://localhost:8000).
 */
const SSO_API_BASE = API_URL.endsWith('/api/auth')
  ? API_URL.slice(0, -'/api/auth'.length)
  : ''

export const sso = createSsoClient({
  ssoUrl: window.location.origin,
  apiBase: SSO_API_BASE,
})

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const SAFE_METHODS = new Set(['get', 'head', 'options'])

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const method = (config.method || 'get').toLowerCase()
    const csrfToken = readCsrfToken()
    if (csrfToken && !SAFE_METHODS.has(method)) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Endpoints whose 401 means "bad credentials / no session", not "access token
// expired" — never refresh-and-retry these.
const NO_RETRY_ENDPOINTS = [
  '/refresh',
  '/session',
  '/login',
  '/logout',
  '/signup',
  '/forgot-password',
  '/reset-password',
]

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }
    const path = (originalRequest.url || '').split('?')[0]
    if (NO_RETRY_ENDPOINTS.includes(path)) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    let stillSignedIn: boolean
    try {
      // GET /session refreshes server-side; the SDK shares one in-flight
      // request between callers, so refresh tokens are never rotated twice.
      stillSignedIn = await sso.refresh()
    } catch {
      return Promise.reject(error)
    }
    if (stillSignedIn) {
      return apiClient(originalRequest)
    }
    window.dispatchEvent(new CustomEvent('auth:logout'))
    return Promise.reject(error)
  }
)

export default apiClient
