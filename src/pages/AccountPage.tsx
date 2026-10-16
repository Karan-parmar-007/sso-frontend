import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
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
  History,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import {
  eventDetails,
  eventLabel,
  eventTone,
  formatWhen,
  shortUserAgent,
  type AuditEventsResponse,
} from '@/lib/auditEvents'
import { cn } from '@/lib/utils'
import type { LoginLocationState } from '@/pages/LoginPage'

type Session = {
  id: string
  device_info?: string | null
  ip_address?: string | null
  created_at?: string | null
  last_seen_at?: string | null
  expires_at?: string | null
  is_current: boolean
}

const ACTIVITY_PAGE_SIZE = 10

export default function AccountPage() {
  const { user, logout, refreshUser, setShowVerifyModal, resendVerification } =
    useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const [sessionBusyId, setSessionBusyId] = useState<string | null>(null)
  const [confirmEverywhere, setConfirmEverywhere] = useState(false)
  const [activityPage, setActivityPage] = useState(1)

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    staleTime: 0,
    queryFn: async () => {
      const { data } = await apiClient.get<{
        total_count: number
        sessions: Session[]
      }>('/sessions')
      return data.sessions
    },
  })

  const activityQuery = useQuery({
    queryKey: ['activity', activityPage],
    staleTime: 0,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await apiClient.get<AuditEventsResponse>('/activity', {
        params: { page: activityPage, page_size: ACTIVITY_PAGE_SIZE },
      })
      return data
    },
  })

  if (!user) return null

  const sessions = sessionsQuery.data ?? []
  const sessionsLoading = sessionsQuery.isFetching
  const activity = activityQuery.data
  const activityPages = Math.max(
    1,
    Math.ceil((activity?.total_count ?? 0) / ACTIVITY_PAGE_SIZE)
  )

  function refreshSecurityData() {
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
    queryClient.invalidateQueries({ queryKey: ['activity'] })
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleLogoutEverywhere() {
    setSessionBusyId('everywhere')
    await logout({ everywhere: true })
    setSessionBusyId(null)
    setConfirmEverywhere(false)
    const state: LoginLocationState = {
      notice: {
        title: 'Signed out everywhere',
        body: 'Every session on every device has been ended.',
      },
    }
    navigate('/login', { replace: true, state })
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    setBusy(true)
    try {
      const { data } = await apiClient.post<{ message: string }>('/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      // e.g. "Password changed successfully; signed out 2 other session(s)"
      toast.success(data.message)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      refreshSecurityData()
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
      const { data } = await apiClient.post<{ message: string }>('/request-email-change', {
        new_email: newEmail,
        current_password: emailPassword,
      })
      toast.success(data.message)
      setNewEmail('')
      setEmailPassword('')
      refreshSecurityData()
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
        `/sessions/${encodeURIComponent(session.id)}`
      )
      toast.success(data.message)
      if (session.is_current) {
        await logout()
        navigate('/login')
        return
      }
      refreshSecurityData()
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
      refreshSecurityData()
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
              {Object.entries(user.app_roles ?? {}).map(([app, appRoles]) => (
                <div
                  key={app}
                  className="inline-flex items-center gap-1 rounded-full border border-[rgba(100,255,218,0.2)] px-3 py-1 text-xs text-[#8892b0]"
                >
                  <span className="text-[#ccd6f6]">{app}</span>
                  <span>· {appRoles.join(', ')}</span>
                </div>
              ))}
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
                        toast.success(await resendVerification())
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
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                  onClick={() => sessionsQuery.refetch()}
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
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={sessionBusyId !== null}
                  onClick={() => setConfirmEverywhere(true)}
                >
                  <LogOut className="size-4" />
                  Sign out everywhere
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
                        {shortUserAgent(session.device_info)}
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

              {sessionsQuery.isError && (
                <p className="text-sm text-amber-300">
                  {getErrorMessage(sessionsQuery.error, 'Failed to load sessions')}
                </p>
              )}
              {sessionsQuery.isSuccess && sessions.length === 0 && (
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
              <CardDescription>
                Requires your current password. Your other sessions are signed out.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="old-password">Current password</Label>
                  <PasswordInput
                    id="old-password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <PasswordInput
                    id="new-password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <PasswordInput
                    id="confirm-password"
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
                We send a confirmation link to the new address. Confirming it signs you
                out everywhere.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-email">New email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-current-password">Current password</Label>
                  <PasswordInput
                    id="email-current-password"
                    required
                    autoComplete="current-password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
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

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="md:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="size-4 text-[#64ffda]" />
                  Recent security activity
                </CardTitle>
                <CardDescription>
                  Sign-ins, password and email changes on your account. Don&apos;t
                  recognise something? Change your password and sign out everywhere.
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => activityQuery.refetch()}
                disabled={activityQuery.isFetching}
              >
                <RefreshCw
                  className={`size-4 ${activityQuery.isFetching ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity?.events.map((event) => {
                const tone = eventTone(event.event)
                const details = eventDetails(event)
                return (
                  <div
                    key={event.id}
                    className={cn(
                      'flex flex-col gap-1 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
                      tone === 'danger'
                        ? 'border-red-400/40 bg-red-400/5'
                        : tone === 'warning'
                          ? 'border-amber-400/30 bg-amber-400/5'
                          : 'border-[rgba(100,255,218,0.1)] bg-[#0a192f]/40'
                    )}
                  >
                    <div className="min-w-0 space-y-1">
                      <p
                        className={cn(
                          'text-sm',
                          tone === 'danger'
                            ? 'text-red-300'
                            : tone === 'warning'
                              ? 'text-amber-300'
                              : 'text-[#ccd6f6]'
                        )}
                      >
                        {eventLabel(event.event)}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8892b0]">
                        {event.ip && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" />
                            {event.ip}
                          </span>
                        )}
                        {event.user_agent && (
                          <span className="truncate">{shortUserAgent(event.user_agent, 60)}</span>
                        )}
                        {details && <span>{details}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-[#8892b0]">
                      {formatWhen(event.created_at)}
                    </span>
                  </div>
                )
              })}

              {activityQuery.isError && (
                <p className="text-sm text-amber-300">
                  {getErrorMessage(activityQuery.error, 'Failed to load activity')}
                </p>
              )}
              {activity && activity.events.length === 0 && (
                <p className="text-sm text-[#8892b0]">No activity recorded yet.</p>
              )}

              {activity && activityPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-1">
                  <p className="text-sm text-[#8892b0]">
                    Page {activity.page} of {activityPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={activityPage <= 1 || activityQuery.isFetching}
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      disabled={activityPage >= activityPages || activityQuery.isFetching}
                      onClick={() => setActivityPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Dialog
        open={confirmEverywhere}
        onOpenChange={(open) => {
          if (sessionBusyId !== 'everywhere') setConfirmEverywhere(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out everywhere?</DialogTitle>
            <DialogDescription>
              This ends every session on every device and app, including this one.
              You will need to sign in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={sessionBusyId === 'everywhere'}
              onClick={() => setConfirmEverywhere(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={sessionBusyId === 'everywhere'}
              onClick={handleLogoutEverywhere}
            >
              {sessionBusyId === 'everywhere' ? 'Signing out…' : 'Sign out everywhere'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
