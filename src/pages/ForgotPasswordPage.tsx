import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

export default function ForgotPasswordPage() {
  const location = useLocation()
  const loginLink = `/login${location.search}`
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await apiClient.post<{ message: string }>('/forgot-password', { email })
      setSent(true)
      toast.success(data.message || 'If that email exists, a reset link was sent')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
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
            locked out?
          </p>
          <h1 className="font-hand text-3xl font-bold text-[var(--ink)] mt-1.5 leading-none">
            Reset password
          </h1>
          <p className="text-xs sm:text-sm text-[var(--pencil)] mt-2 leading-relaxed">
            {sent
              ? 'Check your inbox for instructions to get back into your account.'
              : 'Enter your email address and we will send a secure link to create a new password.'}
          </p>
        </div>

        {sent ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-[var(--paper-border-strong)] bg-[var(--forest-tint)] p-4 text-xs sm:text-sm">
              <div className="flex gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--forest)]" />
                <div className="text-[var(--pencil)] space-y-1 leading-relaxed">
                  <p>
                    If an account exists for{' '}
                    <strong className="text-[var(--ink)]">{email}</strong>, we sent a secure reset link.
                  </p>
                  <p className="text-[11px] text-[var(--pencil-light)]">
                    It expires shortly and can only be used once. Check your spam folder if you do not see it.
                  </p>
                </div>
              </div>
            </div>

            <Button asChild variant="default" size="lg" className="w-full">
              <Link to={loginLink}>
                <ArrowLeft className="size-4" />
                Back to sign in
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full mt-2"
              disabled={loading}
            >
              <Mail className="size-4" />
              {loading ? 'Sending link…' : 'Send reset link'}
            </Button>

            <p className="text-center text-xs text-[var(--pencil)] mt-1">
              Remembered your password?{' '}
              <Link to={loginLink} className="font-semibold text-[var(--forest)] hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        )}
      </motion.section>
    </div>
  )
}
