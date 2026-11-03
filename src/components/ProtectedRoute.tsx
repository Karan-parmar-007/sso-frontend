import { useMemo } from 'react'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { loginPathFor, resolveReturnUrl } from '@/lib/returnUrl'

export function FullPageLoading() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center text-[var(--pencil)] gap-3">
      <Loader2 className="size-6 animate-spin text-[var(--forest)]" />
      <span className="font-hand text-lg text-[var(--pencil)]">opening desk…</span>
    </div>
  )
}

/** Sends the visitor to /login?next=<this page> so they come back afterwards. */
function RedirectToLogin() {
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
