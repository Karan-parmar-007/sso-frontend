import { useEffect, useState } from 'react'
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
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending')
  const [message, setMessage] = useState('Verifying…')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await apiClient.post('/verify-email', { token })
        if (cancelled) return
        await refreshUser()
        setStatus('ok')
        setMessage('Email verified successfully')
        toast.success('Email verified')
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setMessage(getErrorMessage(err, 'Verification failed'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, refreshUser])

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
              <Link to={status === 'ok' ? '/account' : '/login'}>
                {status === 'ok' ? 'Go to account' : 'Back to sign in'}
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
