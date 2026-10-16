import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [message, setMessage] = useState(token ? 'Verifying…' : 'Missing verification token')
  // Tokens are single-use: never post twice (StrictMode re-runs effects).
  const submitted = useRef<string | null>(null)

  useEffect(() => {
    if (!token || submitted.current === token) return
    submitted.current = token
    ;(async () => {
      try {
        await apiClient.post('/verify-email', { token })
        await refreshUser()
        setStatus('ok')
        setMessage('Email verified successfully')
        toast.success('Email verified')
      } catch (err) {
        setStatus('error')
        setMessage(getErrorMessage(err, 'Verification failed'))
      }
    })()
  }, [token, refreshUser])

  const signedIn = Boolean(user)

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Email <span className="gradient-text">verification</span>
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {status !== 'pending' && (
            <Button asChild variant="default">
              <Link to={signedIn ? '/account' : '/login'}>
                {signedIn ? 'Go to account' : status === 'ok' ? 'Sign in' : 'Back to sign in'}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
