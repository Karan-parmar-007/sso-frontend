import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    token ? 'Confirming email change…' : 'Missing confirmation token'
  )
  // Tokens are single-use: never post twice (StrictMode re-runs effects).
  const submitted = useRef<string | null>(null)

  useEffect(() => {
    if (!token || submitted.current === token) return
    submitted.current = token
    ;(async () => {
      try {
        const { data } = await apiClient.post<AuthUser>('/confirm-email-change', { token })
        // The backend signed this account out everywhere (cookies cleared);
        // forget the user locally and tell other tabs.
        await logout()
        toast.success('Email updated')
        const state: LoginLocationState = {
          email: data.email,
          notice: {
            title: 'Email updated',
            body: `Your email is now ${data.email}. For your security you were signed out everywhere — sign in again with your new address.`,
          },
        }
        navigate('/login', { replace: true, state })
      } catch (err) {
        setStatus('error')
        setMessage(getErrorMessage(err, 'Confirmation failed'))
      }
    })()
  }, [token, logout, navigate])

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
          {status === 'error' && (
            <Button asChild variant="default" className="w-full">
              <Link to="/account">Back to account</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
