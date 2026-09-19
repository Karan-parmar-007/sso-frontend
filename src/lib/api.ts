import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const API_URL = (
  (window as Window & { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api/auth'
).replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(^|;\s*)csrf_token=([^;]+)/)
  return match ? match[2] : null
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const authEndpoints = [
      '/refresh',
      '/login',
      '/logout',
      '/signup',
      '/forgot-password',
      '/reset-password',
    ]
    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    )

    if (
      error.response?.status === 401 &&
      !isAuthEndpoint &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => apiClient(originalRequest))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await axios.post(`${API_URL}/refresh`, {}, { withCredentials: true })
        processQueue()
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
