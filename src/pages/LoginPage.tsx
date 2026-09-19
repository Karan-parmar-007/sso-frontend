import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { MailCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import { resolveReturnUrl } from '@/lib/returnUrl'

type LoginLocationState = {
  email?: string
  verificationSent?: boolean
}

function goAfterLogin(returnUrl: string | null, navigate: ReturnType<typeof useNavigate>) {
  if (returnUrl) {
    window.location.assign(returnUrl)
    return
  }
  navigate('/account')
}

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth()
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
  const [showVerificationBanner, setShowVerificationBanner] = useState(
    Boolean(state?.verificationSent)
  )

  useEffect(() => {
    if (state?.verificationSent) {
      // Clear history state so refresh doesn't keep showing the banner forever
      navigate(
        { pathname: location.pathname, search: location.search },
        { replace: true, state: {} },
      )
    }
  }, [state?.verificationSent, navigate, location.pathname, location.search])

  // Already signed in + valid ?next= → bounce back to the calling app
  useEffect(() => {
    if (authLoading || !user) return
    if (returnUrl) {
      window.location.replace(returnUrl)
    }
  }, [authLoading, user, returnUrl])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password, rememberMe)
      toast.success('Welcome back')
      goAfterLogin(returnUrl, navigate)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'))
    } finally {
      setLoading(false)
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
          {showVerificationBanner && (
            <div className="mb-4 flex gap-3 rounded-lg border border-[#64ffda]/25 bg-[#64ffda]/10 p-3 text-sm text-[#ccd6f6]">
              <MailCheck className="mt-0.5 size-4 shrink-0 text-[#64ffda]" />
              <div>
                <p className="font-medium text-[#64ffda]">Verification email sent</p>
                <p className="mt-1 text-[#8892b0]">
                  Check your inbox, then sign in below. You can verify anytime after logging in.
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs text-[#64ffda] hover:underline"
                  onClick={() => setShowVerificationBanner(false)}
                >
                  Dismiss
                </button>
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
                  to="/forgot-password"
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
