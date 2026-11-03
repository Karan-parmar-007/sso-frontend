import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api'
import { useAuth, type AuthUser } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'
import type { LoginLocationState } from '@/pages/LoginPage'

export default function ConfirmEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'pending' | 'error'>(token ? 'pending' : 'error')
  const [message, setMessage] = useState(
    token ? 'Confirming your new email address…' : 'Missing confirmation token'
  )
  const submitted = useRef<string | null>(null)

  useEffect(() => {
    if (!token || submitted.current === token) return
    submitted.current = token
    ;(async () => {
      try {
        const { data } = await apiClient.post<AuthUser>('/confirm-email-change', { token })
        await logout()
        toast.success('Email updated')
        const state: LoginLocationState = {
          email: data.email,
          notice: {
            title: 'Email updated',
            body: `Your email is now ${data.email}. For security you were signed out everywhere — please sign in again with your new address.`,
          },
        }
        navigate('/login', { replace: true, state })
      } catch (err) {
        setStatus('error')
        setMessage(getErrorMessage(err, 'Confirmation failed or link expired.'))
      }
    })()
  }, [token, logout, navigate])

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
          {status === 'pending' ? (
            <div className="size-12 rounded-full bg-[var(--forest-tint)] flex items-center justify-center text-[var(--forest)]">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <div className="size-12 rounded-full bg-[var(--terracotta-tint)] flex items-center justify-center text-[var(--terracotta)]">
              <AlertCircle className="size-7" />
            </div>
          )}
        </div>

        <h1 className="font-hand text-3xl font-bold text-[var(--ink)] leading-tight">
          {status === 'pending' ? 'Confirming email' : 'Confirmation problem'}
        </h1>

        <p className="text-xs sm:text-sm text-[var(--pencil)] mt-2 leading-relaxed">
          {message}
        </p>

        {status === 'error' && (
          <div className="mt-6">
            <Button asChild variant="default" size="lg" className="w-full">
              <Link to="/account">
                <ArrowLeft className="size-4" />
                Back to account
              </Link>
            </Button>
          </div>
        )}
      </motion.section>
    </div>
  )
}
