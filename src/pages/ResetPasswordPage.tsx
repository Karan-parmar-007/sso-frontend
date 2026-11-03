import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { AlertCircle, Check } from 'lucide-react'
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
            new key
          </p>
          <h1 className="font-hand text-3xl font-bold text-[var(--ink)] mt-1.5 leading-none">
            Set a new password
          </h1>
          <p className="text-xs sm:text-sm text-[var(--pencil)] mt-2 leading-relaxed">
            Choose at least 8 characters with a letter and a number.
          </p>
        </div>

        {!token ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--terracotta-border)] bg-[var(--terracotta-tint)] p-4 text-xs sm:text-sm">
              <div className="flex gap-2.5">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--terracotta)]" />
                <div className="text-[var(--pencil)] space-y-1">
                  <p className="font-semibold text-[var(--terracotta)]">Invalid or expired link</p>
                  <p>This password reset link is missing a valid security token.</p>
                </div>
              </div>
            </div>

            <Button asChild variant="default" size="lg" className="w-full">
              <Link to="/forgot-password">Request a new reset link</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new">New password</Label>
              <PasswordInput
                id="new"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">Confirm password</Label>
              <PasswordInput
                id="confirm"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat password"
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              className="w-full mt-2"
              disabled={loading}
            >
              <Check className="size-4" />
              {loading ? 'Saving new password…' : 'Update password'}
            </Button>
          </form>
        )}
      </motion.section>
    </div>
  )
}
