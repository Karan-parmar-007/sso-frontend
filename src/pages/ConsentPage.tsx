import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { AppWindow, Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FullPageLoading } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { loginPathFor } from '@/lib/returnUrl'

type ConsentRequest = {
  client: { client_id: string; name: string }
  scopes: string[]
  user: { email: string }
}

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  openid: 'Confirm your identity (sign you in)',
  profile: 'See your name',
  email: 'See your email address and whether it is verified',
  offline_access: 'Stay signed in when you are not actively using it',
}

export default function ConsentPage() {
  const [params] = useSearchParams()
  const requestId = params.get('request') || ''
  const { user, loading, logout } = useAuth()
  const [submitting, setSubmitting] = useState<'approve' | 'deny' | null>(null)

  const consent = useQuery({
    queryKey: ['oauth-consent', requestId],
    enabled: Boolean(user && requestId),
    retry: false,
    queryFn: async () => {
      const { data } = await apiClient.get<ConsentRequest>(
        `/oauth/consent/${encodeURIComponent(requestId)}`
      )
      return data
    },
  })

  if (loading) return <FullPageLoading />
  if (!user) return <Navigate to={loginPathFor(window.location.href)} replace />

  async function decide(approve: boolean) {
    setSubmitting(approve ? 'approve' : 'deny')
    try {
      const { data } = await apiClient.post<{ redirect_to: string }>(
        `/oauth/consent/${encodeURIComponent(requestId)}`,
        { approve }
      )
      const target = new URL(data.redirect_to, window.location.origin)
      if (target.protocol !== 'https:' && target.protocol !== 'http:') {
        throw new Error('Invalid redirect')
      }
      window.location.assign(target.toString())
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not complete the request'))
      setSubmitting(null)
    }
  }

  async function switchAccount() {
    await logout()
  }

  return (
    <div className="w-full max-w-md mx-auto py-4 sm:py-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="desk-sheet p-6 sm:p-8"
      >
        <span className="desk-sheet-tape" aria-hidden />

        <div className="mb-6">
          <p className="font-hand text-lg text-[var(--forest)] font-semibold leading-none">
            authorization request
          </p>
          <h1 className="font-hand text-3xl font-bold text-[var(--ink)] mt-1.5 leading-none">
            Connect application
          </h1>
          <p className="text-xs sm:text-sm text-[var(--pencil)] mt-2 leading-relaxed">
            Review the access permissions requested below.
          </p>
        </div>

        {!requestId ? (
          <div className="rounded-xl border border-[var(--terracotta-border)] bg-[var(--terracotta-tint)] p-4 text-xs sm:text-sm">
            <div className="flex gap-2.5">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--terracotta)]" />
              <p className="text-[var(--pencil)]">This authorization link is missing its request identifier.</p>
            </div>
          </div>
        ) : consent.isPending ? (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--pencil)] gap-2">
            <Loader2 className="size-6 animate-spin text-[var(--forest)]" />
            <p className="text-xs">Loading authorization details…</p>
          </div>
        ) : consent.isError ? (
          <div className="rounded-xl border border-[var(--terracotta-border)] bg-[var(--terracotta-tint)] p-4 text-xs sm:text-sm">
            <div className="flex gap-2.5">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--terracotta)]" />
              <div className="text-[var(--pencil)] space-y-1">
                <p className="font-semibold text-[var(--terracotta)]">Request expired</p>
                <p>{getErrorMessage(consent.error, 'This request has expired or is invalid.')} Return to the application and try again.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--paper-border-strong)] bg-[var(--forest-tint-subtle)]">
              <div className="size-10 rounded-lg bg-[var(--forest-tint)] flex items-center justify-center text-[var(--forest)] shrink-0">
                <AppWindow className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-[var(--ink)] truncate">
                  {consent.data.client.name}
                </p>
                <p className="text-xs text-[var(--pencil-light)] truncate">
                  {consent.data.client.client_id}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pencil)] mb-2.5">
                Permissions requested:
              </p>
              <ul className="space-y-2">
                {consent.data.scopes.map((scope) => (
                  <li
                    key={scope}
                    className="flex items-start gap-2.5 rounded-xl border border-[var(--paper-border)] bg-[var(--paper)] px-3.5 py-2.5 text-xs sm:text-sm"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--forest)]" />
                    <span className="text-[var(--ink)]">
                      {SCOPE_DESCRIPTIONS[scope] ?? scope}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--pencil)] pt-2 border-t border-[var(--paper-border)]">
              <span>
                Signed in as <strong className="text-[var(--ink)]">{consent.data.user.email}</strong>
              </span>
              <button
                type="button"
                onClick={switchAccount}
                className="font-medium text-[var(--forest)] hover:underline cursor-pointer"
              >
                Switch account
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={submitting !== null}
                onClick={() => decide(false)}
              >
                {submitting === 'deny' ? 'Denying…' : 'Deny'}
              </Button>
              <Button
                type="button"
                variant="default"
                size="lg"
                disabled={submitting !== null}
                onClick={() => decide(true)}
              >
                {submitting === 'approve' ? 'Authorizing…' : 'Allow access'}
              </Button>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  )
}
