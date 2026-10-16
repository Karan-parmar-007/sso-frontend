import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { AppWindow, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  offline_access: 'Stay signed in when you are not using it',
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
    // Once signed out this page re-renders into /login?next=<this request>.
    await logout()
  }

  let body: React.ReactNode
  if (!requestId) {
    body = <p className="text-sm text-[#8892b0]">This link is missing its request id.</p>
  } else if (consent.isPending) {
    body = <p className="text-sm text-[#8892b0]">Loading request…</p>
  } else if (consent.isError) {
    body = (
      <p className="text-sm text-[#8892b0]">
        {getErrorMessage(consent.error, 'This request has expired or is invalid.')} Go back to
        the application and try again.
      </p>
    )
  } else {
    const { client, scopes } = consent.data
    body = (
      <div className="space-y-5">
        <p className="text-sm text-[#8892b0]">
          <span className="font-medium text-[#ccd6f6]">{client.name}</span> wants to access
          your account. It will be able to:
        </p>
        <ul className="space-y-2">
          {scopes.map((scope) => (
            <li
              key={scope}
              className="flex items-start gap-2 rounded-md border border-[rgba(100,255,218,0.1)] bg-[#0a192f]/40 px-3 py-2 text-sm"
            >
              <Check className="mt-0.5 size-4 shrink-0 text-[#64ffda]" />
              <span className="text-[#ccd6f6]">
                {SCOPE_DESCRIPTIONS[scope] ?? scope}
                <span className="ml-2 font-mono text-xs text-[#8892b0]">{scope}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#8892b0]">
          Signed in as{' '}
          <span className="text-[#ccd6f6]">{consent.data.user.email}</span>.{' '}
          <button
            type="button"
            className="text-[#64ffda] hover:underline"
            onClick={switchAccount}
            disabled={submitting !== null}
          >
            Not you?
          </button>
        </p>
        <div className="flex gap-3">
          <Button
            className="flex-1"
            variant="ghost"
            disabled={submitting !== null}
            onClick={() => decide(false)}
          >
            {submitting === 'deny' ? 'Cancelling…' : 'Deny'}
          </Button>
          <Button
            className="flex-1"
            variant="default"
            disabled={submitting !== null}
            onClick={() => decide(true)}
          >
            {submitting === 'approve' ? 'Continuing…' : 'Allow'}
          </Button>
        </div>
        <p className="text-xs text-[#8892b0]">
          Only allow applications you trust. You will be returned to{' '}
          <span className="font-mono">{client.client_id}</span> after you decide.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <AppWindow className="size-5 text-[#64ffda]" />
            Authorize <span className="gradient-text">access</span>
          </CardTitle>
          <CardDescription>Review what this application is asking for</CardDescription>
        </CardHeader>
        <CardContent>{body}</CardContent>
      </Card>
    </motion.div>
  )
}
