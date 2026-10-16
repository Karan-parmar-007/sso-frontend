import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { AlertTriangle, MailCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/contexts/AuthContext'
import {
  formatRetryAfter,
  getErrorCode,
  getErrorMessage,
  getErrorStatus,
  getRetryAfterSeconds,
} from '@/lib/errors'
import { resolveReturnUrl } from '@/lib/returnUrl'

type Notice = { title: string; body?: string; resendTo?: string }

export type LoginLocationState = {
  email?: string
  /** Set by the signup page. */
  verificationSent?: boolean
  /** Generic notice, e.g. after an email change or "sign out everywhere". */
  notice?: Notice
}

type LoginProblem =
  | { kind: 'unverified'; email: string; message: string }
  | { kind: 'locked'; message: string }

export default function LoginPage() {
  const { login, user, loading: authLoading, resendVerificationFor } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = (location.state as LoginLocationState | null) || null
  const returnUrl = useMemo(
    () => resolveReturnUrl(searchParams.get('next')),
    [searchParams],
  )

  const [email, setEmail] = useState(state?.email || '')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(() => {
    if (state?.notice) return state.notice
    if (state?.verificationSent) {
      return {
        title: 'Check your inbox',
        body: 'If this is a new account, we sent you a link to verify your email. Verify it, then sign in below.',
        resendTo: state.email,
      }
    }
    return null
  })
  const [problem, setProblem] = useState<LoginProblem | null>(null)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (state?.verificationSent || state?.notice) {
      // Clear history state so a reload doesn't keep showing the banner
      navigate(
        { pathname: location.pathname, search: location.search },
        { replace: true, state: {} },
      )
    }
  }, [state?.verificationSent, state?.notice, navigate, location.pathname, location.search])

  // OAuth prompt=login / max_age: ask for the password even when signed in.
  const forceLogin = searchParams.get('prompt') === 'login'

  // Already signed in + valid ?next= → bounce back to the calling app
  useEffect(() => {
    if (authLoading || !user || forceLogin) return
    if (returnUrl) {
      window.location.replace(returnUrl)
    }
  }, [authLoading, user, returnUrl, forceLogin])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setProblem(null)
    try {
      await login(email, password, rememberMe)
      toast.success('Welcome back')
      if (returnUrl) {
        window.location.assign(returnUrl)
      } else {
        navigate('/account')
      }
    } catch (err) {
      const status = getErrorStatus(err)
      if (status === 403 && getErrorCode(err) === 'email_not_verified') {
        setNotice(null)
        setProblem({
          kind: 'unverified',
          email: email.trim(),
          message: getErrorMessage(err, 'Please verify your email before signing in.'),
        })
      } else if (status === 429) {
        const retry = getRetryAfterSeconds(err)
        const base = getErrorMessage(err, 'Too many attempts.')
        setProblem({
          kind: 'locked',
          message: retry ? `${base} Try again in ${formatRetryAfter(retry)}.` : base,
        })
      } else {
        toast.error(getErrorMessage(err, 'Login failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  async function resend(target: string) {
    setResending(true)
    try {
      const message = await resendVerificationFor(target)
      toast.success(message)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not resend verification email'))
    } finally {
      setResending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className="w-full max-w-md"
    >
      <Card className="glass-hover">
        <CardHeader>
          <CardTitle className="text-2xl">
            Sign <span className="gradient-text">in</span>
          </CardTitle>
          <CardDescription>
            Access every app with one account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notice && (
            <div className="mb-4 flex gap-3 rounded-lg border border-[#64ffda]/25 bg-[#64ffda]/10 p-3 text-sm text-[#ccd6f6]">
              <MailCheck className="mt-0.5 size-4 shrink-0 text-[#64ffda]" />
              <div>
                <p className="font-medium text-[#64ffda]">{notice.title}</p>
                {notice.body && <p className="mt-1 text-[#8892b0]">{notice.body}</p>}
                <div className="mt-2 flex gap-4">
                  {notice.resendTo && (
                    <button
                      type="button"
                      className="text-xs text-[#64ffda] hover:underline disabled:opacity-50"
                      disabled={resending}
                      onClick={() => notice.resendTo && resend(notice.resendTo)}
                    >
                      {resending ? 'Sending…' : 'Resend email'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs text-[#64ffda] hover:underline"
                    onClick={() => setNotice(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          {problem && (
            <div
              role="alert"
              className="mb-4 flex gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-[#ccd6f6]"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
              <div>
                <p className="font-medium text-amber-300">
                  {problem.kind === 'unverified'
                    ? 'Email not verified'
                    : 'Sign-in temporarily locked'}
                </p>
                <p className="mt-1 text-[#8892b0]">{problem.message}</p>
                {problem.kind === 'unverified' && (
                  <>
                    <p className="mt-1 text-[#8892b0]">
                      Open the link we emailed to{' '}
                      <span className="text-[#ccd6f6]">{problem.email}</span>, then sign in
                      again.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      className="mt-3"
                      disabled={resending}
                      onClick={() => resend(problem.email)}
                    >
                      {resending ? 'Sending…' : 'Resend verification email'}
                    </Button>
                  </>
                )}
                {problem.kind === 'locked' && (
                  <p className="mt-1 text-[#8892b0]">
                    Forgot your password?{' '}
                    <Link
                      to={`/forgot-password${location.search}`}
                      className="text-[#64ffda] hover:underline"
                    >
                      Reset it
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to={`/forgot-password${location.search}`}
                  className="text-xs text-[#64ffda] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#8892b0]">
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              Remember me for 7 days
            </label>
            <Button type="submit" variant="default" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-center text-sm text-[#8892b0]">
              No account?{' '}
              <Link to={`/signup${location.search}`} className="text-[#64ffda] hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
