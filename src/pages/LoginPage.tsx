import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { AlertTriangle, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordInput } from '@/components/ui/password-input'
import { DoodleBook, DoodleHouse, DoodleWave } from '@/components/KeyMark'
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
  verificationSent?: boolean
  notice?: Notice
}

type LoginProblem =
  | { kind: 'unverified'; email: string; message: string }
  | { kind: 'locked'; message: string }

function returnHost(search: string): string | null {
  const next = new URLSearchParams(search).get('next')
  if (!next) return null
  try {
    return new URL(next).host.replace(/^www\./, '')
  } catch {
    return null
  }
}

export default function LoginPage() {
  const { login, user, loading: authLoading, resendVerificationFor } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const state = (location.state as LoginLocationState | null) || null
  const returnUrl = useMemo(
    () => resolveReturnUrl(searchParams.get('next')),
    [searchParams]
  )
  const backTo = returnHost(location.search)

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
      navigate(
        { pathname: location.pathname, search: location.search },
        { replace: true, state: {} }
      )
    }
  }, [state?.verificationSent, state?.notice, navigate, location.pathname, location.search])

  const forceLogin = searchParams.get('prompt') === 'login'

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
    <div className="w-full max-w-5xl mx-auto py-2 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Context & Proof Sketches */}
        <div className="lg:col-span-6 flex flex-col gap-6 order-2 lg:order-1">
          <div>
            <p className="font-hand text-xl sm:text-2xl font-semibold text-[var(--forest)] leading-none">
              welcome back to the desk
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] mt-2 leading-[1.05]">
              Sign in once.
            </h1>
            <p className="text-sm sm:text-base text-[var(--pencil)] mt-3 sm:mt-4 leading-relaxed max-w-lg">
              One account opens the portfolio, Family OS, and Studio. Once signed in,
              every tab stays connected seamlessly.
            </p>
            {backTo && (
              <p className="font-hand text-lg sm:text-xl text-[var(--terracotta)] mt-2">
                You will return straight to {backTo}.
              </p>
            )}
          </div>

          {/* Place sketches */}
          <div className="relative pt-4 pb-2">
            <svg
              className="absolute left-6 right-6 top-1 h-6 w-[calc(100%-3rem)] pointer-events-none hidden sm:block text-[var(--line)] opacity-60"
              viewBox="0 0 300 24"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M10 18 C 70 2, 130 22, 170 10 S 250 2, 290 14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="sketch-card p-3 sm:p-4 text-center transform -rotate-1 hover:rotate-0 transition-transform">
                <span className="desk-sheet-tape-center" aria-hidden />
                <div className="flex justify-center mb-1 text-[var(--line)]">
                  <DoodleHouse className="w-12 h-10 sm:w-14 sm:h-12" />
                </div>
                <strong className="block font-hand text-base sm:text-lg font-bold text-[var(--ink)] leading-tight">
                  Portfolio
                </strong>
                <span className="block text-[10px] sm:text-xs text-[var(--pencil-light)] mt-0.5">
                  karanparmar.in
                </span>
              </div>

              <div className="sketch-card p-3 sm:p-4 text-center transform rotate-1 sm:translate-y-1.5 hover:rotate-0 transition-transform">
                <span className="desk-sheet-tape-center" aria-hidden />
                <div className="flex justify-center mb-1 text-[var(--line)]">
                  <DoodleBook className="w-12 h-10 sm:w-14 sm:h-12" />
                </div>
                <strong className="block font-hand text-base sm:text-lg font-bold text-[var(--ink)] leading-tight">
                  Family OS
                </strong>
                <span className="block text-[10px] sm:text-xs text-[var(--pencil-light)] mt-0.5">
                  the family book
                </span>
              </div>

              <div className="sketch-card p-3 sm:p-4 text-center transform -rotate-1 hover:rotate-0 transition-transform">
                <span className="desk-sheet-tape-center" aria-hidden />
                <div className="flex justify-center mb-1 text-[var(--line)]">
                  <DoodleWave className="w-12 h-10 sm:w-14 sm:h-12" />
                </div>
                <strong className="block font-hand text-base sm:text-lg font-bold text-[var(--ink)] leading-tight">
                  Studio
                </strong>
                <span className="block text-[10px] sm:text-xs text-[var(--pencil-light)] mt-0.5">
                  the tools
                </span>
              </div>
            </div>

            <p className="font-hand text-base sm:text-lg text-[var(--pencil)] mt-4">
              One key opens every door.
            </p>
          </div>
        </div>

        {/* Right Column: Taped Paper Form Sheet */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="desk-sheet p-6 sm:p-8 transform lg:rotate-[0.5deg]"
          >
            <span className="desk-sheet-tape" aria-hidden />

            <h2 className="font-hand text-2xl sm:text-3xl font-bold text-[var(--ink)] leading-none">
              Sign in
            </h2>
            <p className="text-xs sm:text-sm text-[var(--pencil)] mt-1.5 mb-5">
              Enter your email and password to continue.
            </p>

            {/* Pinned Notice Note */}
            {notice && (
              <div className="mb-5 relative rounded-xl border border-[var(--paper-border-strong)] bg-[var(--forest-tint)] p-4 text-xs sm:text-sm">
                <div className="flex gap-2.5">
                  <MailCheck className="mt-0.5 size-4 shrink-0 text-[var(--forest)]" />
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--forest)]">{notice.title}</p>
                    {notice.body && <p className="mt-1 text-[var(--pencil)] leading-relaxed">{notice.body}</p>}
                    <div className="mt-2.5 flex items-center gap-4">
                      {notice.resendTo && (
                        <button
                          type="button"
                          className="font-medium text-[var(--forest)] hover:underline disabled:opacity-50 cursor-pointer"
                          disabled={resending}
                          onClick={() => notice.resendTo && resend(notice.resendTo)}
                        >
                          {resending ? 'Sending…' : 'Resend email'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-[var(--pencil-light)] hover:text-[var(--ink)] hover:underline cursor-pointer"
                        onClick={() => setNotice(null)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pinned Problem Note */}
            {problem && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-[var(--terracotta-border)] bg-[var(--terracotta-tint)] p-4 text-xs sm:text-sm"
              >
                <div className="flex gap-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--terracotta)]" />
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--terracotta)]">
                      {problem.kind === 'unverified'
                        ? 'Email not verified'
                        : 'Sign-in temporarily locked'}
                    </p>
                    <p className="mt-1 text-[var(--pencil)] leading-relaxed">{problem.message}</p>
                    {problem.kind === 'unverified' && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={resending}
                          onClick={() => resend(problem.email)}
                        >
                          {resending ? 'Sending…' : 'Resend verification email'}
                        </Button>
                      </div>
                    )}
                    {problem.kind === 'locked' && (
                      <p className="mt-2 text-xs text-[var(--pencil)]">
                        Forgot your password?{' '}
                        <Link
                          to={`/forgot-password${location.search}`}
                          className="font-medium text-[var(--forest)] hover:underline"
                        >
                          Reset it
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to={`/forgot-password${location.search}`}
                    className="text-xs text-[var(--forest)] hover:underline font-medium"
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
                  placeholder="Your password"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(v === true)}
                />
                <label
                  htmlFor="remember-me"
                  className="text-xs text-[var(--pencil)] select-none cursor-pointer"
                >
                  Remember this device for 7 days
                </label>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>

              <p className="text-center text-xs sm:text-sm text-[var(--pencil)] mt-2">
                No account yet?{' '}
                <Link
                  to={`/signup${location.search}`}
                  className="font-semibold text-[var(--forest)] hover:underline"
                >
                  Make one account
                </Link>
              </p>
            </form>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
