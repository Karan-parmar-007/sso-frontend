import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import apiClient from '@/lib/api'

export type AuthUser = {
  id: string
  name: string
  email: string
  email_verified: boolean
  role_name?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  showVerifyModal: boolean
  setShowVerifyModal: (v: boolean) => void
  refreshUser: () => Promise<void>
  login: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => Promise<AuthUser>
  signup: (name: string, email: string, password: string) => Promise<string>
  logout: () => Promise<void>
  resendVerification: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await apiClient.get<AuthUser>('/me')
      setUser(data)
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await apiClient.get<AuthUser>('/me')
        if (!cancelled) setUser(data)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    const onLogout = () => {
      setUser(null)
      setShowVerifyModal(false)
    }
    window.addEventListener('auth:logout', onLogout)
    return () => {
      cancelled = true
      window.removeEventListener('auth:logout', onLogout)
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      const { data } = await apiClient.post<{ user: AuthUser }>('/login', {
        email,
        password,
        remember_me: rememberMe,
      })
      setUser(data.user)
      if (!data.user.email_verified) {
        setShowVerifyModal(true)
      }
      return data.user
    },
    []
  )

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const { data } = await apiClient.post<{ message: string }>('/signup', {
        name,
        email,
        password,
      })
      // Do not create a session — user must sign in separately
      return data.message
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/logout')
    } catch {
      // ignore
    }
    setUser(null)
    setShowVerifyModal(false)
  }, [])

  const resendVerification = useCallback(async () => {
    await apiClient.post('/resend-verification')
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
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
