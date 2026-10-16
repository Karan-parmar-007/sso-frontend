import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import apiClient, { sso } from '@/lib/api'
import type { SsoUser } from '@/lib/sso/sso-client'

export type AuthUser = SsoUser

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  showVerifyModal: boolean
  setShowVerifyModal: (v: boolean) => void
  /** Re-read the session (GET /session; refreshes server-side if needed). */
  refreshUser: () => Promise<void>
  login: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<AuthUser>
  signup: (name: string, email: string, password: string) => Promise<string>
  logout: (opts?: { everywhere?: boolean }) => Promise<void>
  /** Signed in: resend for the current user. */
  resendVerification: () => Promise<string>
  /** Signed out (login screen): generic response, never reveals the account. */
  resendVerificationFor: (email: string) => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  const signedOut = useCallback(() => {
    setUser(null)
    setShowVerifyModal(false)
    queryClient.clear()
  }, [queryClient])

  const refreshUser = useCallback(async () => {
    try {
      const session = await sso.getSession()
      setUser(session.user)
    } catch {
      // Sign-in service unreachable: keep the current state.
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    sso
      .getSession()
      .then((session) => {
        if (!cancelled) setUser(session.user)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    // Login/logout in another tab, or this tab noticing the session changed.
    const unsubscribe = sso.onSessionChange((session) => {
      if (session.authenticated) {
        setUser(session.user)
      } else {
        signedOut()
      }
    })
    window.addEventListener('auth:logout', signedOut)
    return () => {
      cancelled = true
      unsubscribe()
      window.removeEventListener('auth:logout', signedOut)
    }
  }, [signedOut])

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const { data } = await apiClient.post<{ user: AuthUser }>('/login', {
        email,
        password,
        remember_me: rememberMe,
      })
      queryClient.clear()
      setUser(data.user)
      if (!data.user.email_verified) {
        setShowVerifyModal(true)
      }
      // Let the SDK see the new session so other tabs are notified.
      sso.getSession().catch(() => undefined)
      return data.user
    },
    [queryClient]
  )

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await apiClient.post<{ message: string }>('/signup', {
        name,
        email,
        password,
      })
      // No session is created — the user verifies their email, then signs in.
      return data.message
    },
    []
  )

  const logout = useCallback(
    async (opts: { everywhere?: boolean } = {}) => {
      try {
        // Works with an expired access token; always clears cookies.
        await sso.logout(opts)
      } catch {
        // Network failure: still forget the user locally.
      }
      signedOut()
    },
    [signedOut]
  )

  const resendVerification = useCallback(async () => {
    const { data } = await apiClient.post<{ message: string }>('/resend-verification')
    return data.message
  }, [])

  const resendVerificationFor = useCallback(async (email: string) => {
    const { data } = await apiClient.post<{ message: string }>(
      '/resend-verification',
      { email }
    )
    return data.message
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      showVerifyModal,
      setShowVerifyModal,
      refreshUser,
      login,
      signup,
      logout,
      resendVerification,
      resendVerificationFor,
    }),
    [
      user,
      loading,
      showVerifyModal,
      refreshUser,
      login,
      signup,
      logout,
      resendVerification,
      resendVerificationFor,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
