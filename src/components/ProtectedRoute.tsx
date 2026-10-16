import { useMemo } from 'react'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { loginPathFor, resolveReturnUrl } from '@/lib/returnUrl'

export function FullPageLoading() {
  return (
    <div className="min-h-svh flex items-center justify-center text-[#8892b0]">
      Loading…
    </div>
  )
}

/** Sends the visitor to /login?next=<this page> so they come back afterwards. */
function RedirectToLogin() {
  // Re-render when the route changes so `next` is always the current URL.
  useLocation()
  return <Navigate to={loginPathFor(window.location.href)} replace />
}

export function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoading />
  if (!user) return <RedirectToLogin />
  return <Outlet />
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const returnUrl = useMemo(
    () => resolveReturnUrl(searchParams.get('next')),
    [searchParams],
  )

  if (loading) return <FullPageLoading />
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
  if (loading) return <FullPageLoading />
  if (!user) return <RedirectToLogin />
  if (user.role_name !== 'owner') return <Navigate to="/account" replace />
  return <Outlet />
}
