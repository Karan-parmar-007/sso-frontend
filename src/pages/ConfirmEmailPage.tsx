import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import apiClient from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'

export default function ConfirmEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending')
  const [message, setMessage] = useState('Confirming email change…')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing confirmation token')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await apiClient.post('/confirm-email-change', { token })
        if (cancelled) return
        await refreshUser()
        setStatus('ok')
        setMessage('Email updated successfully')
        toast.success('Email updated')
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setMessage(getErrorMessage(err, 'Confirmation failed'))
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
            Confirm <span className="gradient-text">email</span>
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status !== 'pending' && (
            <Button asChild variant="default" className="w-full">
              <Link to="/account">Back to account</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
