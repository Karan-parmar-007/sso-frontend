import { useMemo } from 'react'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { resolveReturnUrl } from '@/lib/returnUrl'

export function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center text-[#8892b0]">
        Loading…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const returnUrl = useMemo(
    () => resolveReturnUrl(searchParams.get('next')),
    [searchParams],
  )

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center text-[#8892b0]">
        Loading…
      </div>
    )
  }
  if (user) {
    if (returnUrl) {
      window.location.replace(returnUrl)
      return null
    }
    return <Navigate to="/account" replace />
  }
  return <Outlet />
}

export function OwnerRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center text-[#8892b0]">
        Loading…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (user.role_name !== 'owner') return <Navigate to="/account" replace />
  return <Outlet />
}
