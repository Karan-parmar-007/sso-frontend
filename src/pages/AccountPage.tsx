import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  Shield,
  Mail,
  KeyRound,
  LogOut,
  LayoutDashboard,
  Monitor,
  RefreshCw,
  MapPin,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

type Session = {
  id: string
  device_info?: string | null
  ip_address?: string | null
  created_at?: string | null
  last_seen_at?: string | null
  expires_at?: string | null
  is_current: boolean
}

function formatWhen(value?: string | null) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function shortDevice(ua?: string | null) {
  if (!ua) return 'Unknown device'
  const text = ua.trim()
  if (text.length <= 72) return text
  return `${text.slice(0, 72)}…`
}

export default function AccountPage() {
  const { user, logout, refreshUser, setShowVerifyModal, resendVerification } =
    useAuth()
  const navigate = useNavigate()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const [sessions, setSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionBusyId, setSessionBusyId] = useState<string | null>(null)

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const { data } = await apiClient.get<{
        total_count: number
        sessions: Session[]
      }>('/sessions')
      setSessions(data.sessions)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load sessions'))
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  if (!user) return null

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await apiClient.post('/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      toast.success('Password changed')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await apiClient.post('/request-email-change', { new_email: newEmail })
      toast.success('Confirmation link sent to the new email')
      setNewEmail('')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function revokeSession(session: Session) {
    setSessionBusyId(session.id)
    try {
      const { data } = await apiClient.delete<{ message: string }>(
        `/sessions/${session.id}`
      )
      toast.success(data.message)
      if (session.is_current) {
        await logout()
        navigate('/login')
        return
      }
      await loadSessions()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to log out session'))
    } finally {
      setSessionBusyId(null)
    }
  }

  async function revokeOthers() {
    setSessionBusyId('others')
    try {
      const { data } = await apiClient.delete<{ message: string }>(
        '/sessions/others'
      )
      toast.success(data.message)
      await loadSessions()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to log out other sessions'))
    } finally {
      setSessionBusyId(null)
    }
  }

  const otherCount = sessions.filter((s) => !s.is_current).length

  return (
    <div className="relative min-h-svh">
      <div className="aurora-bg" aria-hidden />
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto w-full">
        <Link to="/account" className="flex items-center gap-2 text-[#ccd6f6]">
          <Shield className="size-5 text-[#64ffda]" />
          <span className="font-semibold">
            Auth<span className="gradient-text">SSO</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {user.role_name === 'owner' && (
            <Button asChild size="sm">
              <Link to="/admin">
                <LayoutDashboard className="size-4" />
                Admin
              </Link>
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleLogout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-16 grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Welcome, <span className="gradient-text">{user.name}</span>
              </CardTitle>
              <CardDescription>
                {user.email} · role{' '}
                <span className="text-[#64ffda]">{user.role_name || 'user'}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <div
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${
                  user.email_verified
                    ? 'border-[#64ffda]/40 text-[#64ffda]'
                    : 'border-amber-400/40 text-amber-300'
                }`}
              >
                <Mail className="size-3.5" />
                {user.email_verified ? 'Email verified' : 'Email not verified'}
              </div>
              {!user.email_verified && (
                <>
                  <Button size="sm" onClick={() => setShowVerifyModal(true)}>
                    Show reminder
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true)
                      try {
                        await resendVerification()
                        toast.success('Verification email sent')
                      } catch (err) {
                        toast.error(getErrorMessage(err))
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    Resend verification
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="size-4 text-[#64ffda]" />
                  Active sessions
                </CardTitle>
                <CardDescription>
                  Devices where you are signed in. End any session that is not yours.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={loadSessions}
                  disabled={sessionsLoading}
                >
                  <RefreshCw
                    className={`size-4 ${sessionsLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  disabled={otherCount === 0 || sessionBusyId !== null}
                  onClick={revokeOthers}
                >
                  Log out others
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
                    session.is_current
                      ? 'border-[#64ffda]/35 bg-[#64ffda]/5'
                      : 'border-[rgba(100,255,218,0.1)] bg-[#0a192f]/40'
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-[#ccd6f6] truncate">
                        {shortDevice(session.device_info)}
                      </p>
                      {session.is_current && (
                        <span className="rounded-full border border-[#64ffda]/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#64ffda]">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8892b0]">
                      {session.ip_address && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {session.ip_address}
                        </span>
                      )}
                      <span>Signed in {formatWhen(session.created_at)}</span>
                      <span>Last seen {formatWhen(session.last_seen_at)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={session.is_current ? 'ghost' : 'default'}
                    disabled={sessionBusyId !== null}
                    onClick={() => revokeSession(session)}
                  >
                    {session.is_current ? 'End this session' : 'Log out'}
                  </Button>
                </div>
              ))}

              {!sessionsLoading && sessions.length === 0 && (
                <p className="text-sm text-[#8892b0]">
                  No active sessions. Sign in again to create one.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="size-4 text-[#64ffda]" />
                Change password
              </CardTitle>
              <CardDescription>Requires your current password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="space-y-2">
                  <Label>Current password</Label>
                  <PasswordInput
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>New password</Label>
                  <PasswordInput
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm new password</Label>
                  <PasswordInput
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" variant="default" disabled={busy}>
                  Update password
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-4 text-[#64ffda]" />
                Change email
              </CardTitle>
              <CardDescription>
                We send a confirmation link to the new address (1/day)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-3">
                <div className="space-y-2">
                  <Label>New email</Label>
                  <Input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="default" disabled={busy}>
                  Request change
                </Button>
              </form>
              <Button
                className="mt-4"
                variant="ghost"
                size="sm"
                onClick={() => refreshUser()}
              >
                Refresh profile
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
