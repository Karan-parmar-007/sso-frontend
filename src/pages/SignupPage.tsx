import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { DoodleBook, DoodleHouse, DoodleWave } from '@/components/KeyMark'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import type { LoginLocationState } from '@/pages/LoginPage'

function returnHost(search: string): string | null {
  const next = new URLSearchParams(search).get('next')
  if (!next) return null
  try {
    return new URL(next).host.replace(/^www\./, '')
  } catch {
    return null
  }
}

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const backTo = returnHost(location.search)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const message = await signup(name, email, password)
      const state: LoginLocationState = {
        email,
        notice: {
          title: 'Check your inbox',
          body: message || 'Check your inbox to verify your email, then sign in.',
          resendTo: email,
        },
      }
      navigate('/login' + location.search, { replace: true, state })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Signup failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-2 sm:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Story & Sketched Connected Apps */}
        <div className="lg:col-span-6 flex flex-col gap-6 order-2 lg:order-1">
          <div>
            <p className="font-hand text-xl sm:text-2xl font-semibold text-[var(--forest)] leading-none">
              for the site, the family, and studio
            </p>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] mt-2 leading-[1.05]">
              Make one account.
            </h1>
            <p className="text-sm sm:text-base text-[var(--pencil)] mt-3 sm:mt-4 leading-relaxed max-w-lg">
              It opens the portfolio, Family OS, and Studio. You sign up here once.
              After that, signing in on any of them signs you in across the whole suite.
            </p>
            {backTo && (
              <p className="font-hand text-lg sm:text-xl text-[var(--terracotta)] mt-2">
                Then you go straight back to {backTo}.
              </p>
            )}
          </div>

          {/* Hand-drawn place cards */}
          <div className="relative pt-4 pb-2">
            {/* Connecting sketch string */}
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
              No second account. No second password to remember.
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
              Your details
            </h2>
            <p className="text-xs sm:text-sm text-[var(--pencil)] mt-1.5 mb-6">
              A name, an email, and a password. That is the whole thing.
            </p>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="What should we call you"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@email.com"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Letter and a number"
                />
                <p className="text-[11px] text-[var(--pencil-light)] mt-0.5">
                  At least 8 characters, with a letter and a number.
                </p>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? 'Creating…' : 'Create my account'}
              </Button>

              <p className="text-center text-xs sm:text-sm text-[var(--pencil)] mt-2">
                Already have an account?{' '}
                <Link
                  to={`/login${location.search}`}
                  className="font-semibold text-[var(--forest)] hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </motion.section>
        </div>
      </div>
    </div>
  )
}
