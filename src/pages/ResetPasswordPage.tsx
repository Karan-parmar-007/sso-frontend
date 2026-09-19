import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) {
      toast.error('Missing reset token')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await apiClient.post('/reset-password', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      toast.success('Password updated — sign in')
      navigate('/login')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Reset <span className="gradient-text">password</span>
          </CardTitle>
          <CardDescription>Choose a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-[#8892b0]">
              Invalid link.{' '}
              <Link to="/forgot-password" className="text-[#64ffda] hover:underline">
                Request a new one
              </Link>
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="new">New password</Label>
                <PasswordInput
                  id="new"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <PasswordInput
                  id="confirm"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" variant="default" disabled={loading}>
                {loading ? 'Saving…' : 'Update password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
