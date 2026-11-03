import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { user, refreshUser } = useAuth()
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>(
    token ? 'pending' : 'error'
  )
  const [message, setMessage] = useState(token ? 'Confirming your email address…' : 'Missing verification token')
  const submitted = useRef<string | null>(null)

  useEffect(() => {
    if (!token || submitted.current === token) return
    submitted.current = token
    ;(async () => {
      try {
        await apiClient.post('/verify-email', { token })
        await refreshUser()
        setStatus('ok')
        setMessage('Your email address has been verified successfully.')
        toast.success('Email verified')
      } catch (err) {
        setStatus('error')
        setMessage(getErrorMessage(err, 'Verification failed or link expired.'))
      }
    })()
  }, [token, refreshUser])

  const signedIn = Boolean(user)

  return (
    <div className="w-full max-w-md mx-auto py-4 sm:py-8">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="desk-sheet p-6 sm:p-8 text-center"
      >
        <span className="desk-sheet-tape" aria-hidden />

        <div className="mx-auto flex justify-center mb-4">
          {status === 'pending' && (
            <div className="size-12 rounded-full bg-[var(--forest-tint)] flex items-center justify-center text-[var(--forest)]">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}
          {status === 'ok' && (
            <div className="size-12 rounded-full bg-[var(--forest-tint)] flex items-center justify-center text-[var(--forest)]">
              <CheckCircle2 className="size-7" />
            </div>
          )}
          {status === 'error' && (
            <div className="size-12 rounded-full bg-[var(--terracotta-tint)] flex items-center justify-center text-[var(--terracotta)]">
              <AlertCircle className="size-7" />
            </div>
          )}
        </div>

        <h1 className="font-hand text-3xl font-bold text-[var(--ink)] leading-tight">
          {status === 'ok'
            ? 'Email verified!'
            : status === 'error'
              ? 'Verification problem'
              : 'Verifying your email'}
        </h1>

        <p className="text-xs sm:text-sm text-[var(--pencil)] mt-2 leading-relaxed">
          {message}
        </p>

        {status !== 'pending' && (
          <div className="mt-6">
            <Button asChild variant="default" size="lg" className="w-full">
              <Link to={signedIn ? '/account' : '/login'}>
                {signedIn ? 'Go to my account' : status === 'ok' ? 'Sign in now' : 'Back to sign in'}
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </motion.section>
    </div>
  )
}
