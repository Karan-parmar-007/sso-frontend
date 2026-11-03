import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
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
  CheckCircle2,
  AlertTriangle,
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
import { KeyMark } from '@/components/KeyMark'
import { ThemeToggle } from '@/components/ThemeToggle'
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
        body: 'Every session on every device and application has been ended.',
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
    <div className="min-h-svh flex flex-col justify-between transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between gap-4">
        <Link
          to="/account"
          className="group inline-flex items-center gap-2 font-hand text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight hover:opacity-85 transition-opacity"
        >
          <KeyMark className="size-5 sm:size-6 text-[var(--forest)] transition-transform group-hover:rotate-12" />
          <span>karan</span>
          <span className="hidden sm:inline-block font-sans text-[11px] uppercase tracking-wider font-semibold text-[var(--pencil-light)] ml-1 border-l border-[var(--paper-border)] pl-2">
            Account Desk
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {user.role_name === 'owner' && (
            <Button asChild size="sm" variant="outline">
              <Link to="/admin">
                <LayoutDashboard className="size-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </Button>
          )}

          <Button size="sm" variant="ghost" onClick={handleLogout}>
            <LogOut className="size-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-4 sm:py-6 grid gap-6 md:grid-cols-2">
        {/* User Identity Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2"
        >
          <Card>
            <span className="desk-sheet-tape" aria-hidden />
            <CardHeader className="pt-2">
              <p className="font-hand text-xl font-semibold text-[var(--forest)] leading-none">
                identity card
              </p>
              <CardTitle className="text-3xl sm:text-4xl">
                Welcome, {user.name}
              </CardTitle>
              <CardDescription>
                {user.email} · global role{' '}
                <strong className="text-[var(--forest)] font-semibold uppercase text-xs tracking-wider">
                  {user.role_name || 'user'}
                </strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2.5 pt-1">
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border',
                  user.email_verified
                    ? 'border-[var(--forest)]/30 bg-[var(--forest-tint)] text-[var(--forest)]'
                    : 'border-[var(--terracotta)]/30 bg-[var(--terracotta-tint)] text-[var(--terracotta)]'
                )}
              >
                {user.email_verified ? (
                  <>
                    <CheckCircle2 className="size-3.5" />
                    <span>Email verified</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="size-3.5" />
                    <span>Email not verified</span>
                  </>
                )}
              </div>

              {Object.entries(user.app_roles ?? {}).map(([app, appRoles]) => (
                <div
                  key={app}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--paper-border-strong)] bg-[var(--paper)] px-3 py-1 text-xs text-[var(--pencil)]"
                >
                  <strong className="text-[var(--ink)] font-semibold">{app}</strong>
                  <span>· {appRoles.join(', ')}</span>
                </div>
              ))}

              {!user.email_verified && (
                <div className="flex gap-2 ml-auto">
                  <Button size="sm" variant="outline" onClick={() => setShowVerifyModal(true)}>
                    Reminder
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
                    Resend link
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Sessions Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="md:col-span-2"
        >
          <Card>
            <span className="desk-sheet-tape" aria-hidden />
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
              <div>
                <p className="font-hand text-xl font-semibold text-[var(--forest)] leading-none">
                  signed-in devices
                </p>
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                  <Monitor className="size-5 text-[var(--forest)]" />
                  Active sessions
                </CardTitle>
                <CardDescription>
                  Devices where you are currently signed in. End any session you do not recognize.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => sessionsQuery.refetch()}
                  disabled={sessionsLoading}
                >
                  <RefreshCw
                    className={`size-3.5 ${sessionsLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
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
                  <LogOut className="size-3.5" />
                  Sign out everywhere
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between transition-all',
                    session.is_current
                      ? 'border-[var(--forest)]/40 bg-[var(--forest-tint-subtle)]'
                      : 'border-[var(--paper-border)] bg-[var(--paper)]'
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--ink)] truncate">
                        {shortUserAgent(session.device_info)}
                      </p>
                      {session.is_current && (
                        <span className="rounded-full border border-[var(--forest)]/50 bg-[var(--forest-tint)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--forest)]">
                          Current device
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--pencil-light)]">
                      {session.ip_address && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3 text-[var(--pencil)]" />
                          {session.ip_address}
                        </span>
                      )}
                      <span>Signed in {formatWhen(session.created_at)}</span>
                      <span>Last seen {formatWhen(session.last_seen_at)}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={session.is_current ? 'outline' : 'secondary'}
                    disabled={sessionBusyId !== null}
                    onClick={() => revokeSession(session)}
                  >
                    {session.is_current ? 'End this session' : 'Log out device'}
                  </Button>
                </div>
              ))}

              {sessionsQuery.isError && (
                <p className="text-xs text-[var(--terracotta)]">
                  {getErrorMessage(sessionsQuery.error, 'Failed to load sessions')}
                </p>
              )}
              {sessionsQuery.isSuccess && sessions.length === 0 && (
                <p className="text-xs text-[var(--pencil)]">
                  No active sessions recorded.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Password Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <Card className="h-full">
            <span className="desk-sheet-tape" aria-hidden />
            <CardHeader className="pt-2">
              <p className="font-hand text-xl font-semibold text-[var(--forest)] leading-none">
                credentials
              </p>
              <CardTitle className="text-2xl flex items-center gap-2">
                <KeyRound className="size-5 text-[var(--forest)]" />
                Change password
              </CardTitle>
              <CardDescription>
                Requires your current password. Your other active sessions will be signed out.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="old-password">Current password</Label>
                  <PasswordInput
                    id="old-password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Existing password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New password</Label>
                  <PasswordInput
                    id="new-password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <PasswordInput
                    id="confirm-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat new password"
                  />
                </div>
                <Button type="submit" variant="default" className="w-full mt-2" disabled={busy}>
                  {busy ? 'Updating…' : 'Update password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Change Email Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <span className="desk-sheet-tape" aria-hidden />
            <CardHeader className="pt-2">
              <p className="font-hand text-xl font-semibold text-[var(--forest)] leading-none">
                address
              </p>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Mail className="size-5 text-[var(--forest)]" />
                Change email
              </CardTitle>
              <CardDescription>
                We will email a confirmation link. Confirming it signs you out everywhere.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-email">New email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-current-password">Current password</Label>
                  <PasswordInput
                    id="email-current-password"
                    required
                    autoComplete="current-password"
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    placeholder="To confirm identity"
                  />
                </div>
                <Button type="submit" variant="default" className="w-full mt-2" disabled={busy}>
                  {busy ? 'Requesting…' : 'Request email change'}
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-[var(--paper-border)] flex justify-between items-center text-xs text-[var(--pencil)]">
                <span>Profile info out of sync?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refreshUser()}
                >
                  Refresh profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Activity Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="md:col-span-2"
        >
          <Card>
            <span className="desk-sheet-tape" aria-hidden />
            <CardHeader className="flex flex-row items-center justify-between gap-4 pt-2">
              <div>
                <p className="font-hand text-xl font-semibold text-[var(--forest)] leading-none">
                  timeline
                </p>
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                  <History className="size-5 text-[var(--forest)]" />
                  Recent security activity
                </CardTitle>
                <CardDescription>
                  Sign-ins, email changes, and password updates on your account.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => activityQuery.refetch()}
                disabled={activityQuery.isFetching}
              >
                <RefreshCw
                  className={`size-3.5 ${activityQuery.isFetching ? 'animate-spin' : ''}`}
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
                      'flex flex-col gap-1.5 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 transition-all',
                      tone === 'danger'
                        ? 'border-[var(--terracotta)]/40 bg-[var(--terracotta-tint)]'
                        : tone === 'warning'
                          ? 'border-[var(--amber-border)] bg-[var(--amber-card)]'
                          : 'border-[var(--paper-border)] bg-[var(--paper)]'
                    )}
                  >
                    <div className="min-w-0 space-y-1">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          tone === 'danger'
                            ? 'text-[var(--terracotta)]'
                            : tone === 'warning'
                              ? 'text-[var(--amber-text)]'
                              : 'text-[var(--ink)]'
                        )}
                      >
                        {eventLabel(event.event)}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--pencil-light)]">
                        {event.ip && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3 text-[var(--pencil)]" />
                            {event.ip}
                          </span>
                        )}
                        {event.user_agent && (
                          <span className="truncate max-w-xs">{shortUserAgent(event.user_agent, 55)}</span>
                        )}
                        {details && <span className="font-medium text-[var(--pencil)]">{details}</span>}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-[var(--pencil-light)]">
                      {formatWhen(event.created_at)}
                    </span>
                  </div>
                )
              })}

              {activityQuery.isError && (
                <p className="text-xs text-[var(--terracotta)]">
                  {getErrorMessage(activityQuery.error, 'Failed to load security activity')}
                </p>
              )}
              {activity && activity.events.length === 0 && (
                <p className="text-xs text-[var(--pencil)]">No activity recorded yet.</p>
              )}

              {activity && activityPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--paper-border)]">
                  <p className="text-xs text-[var(--pencil)]">
                    Page {activity.page} of {activityPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={activityPage <= 1 || activityQuery.isFetching}
                      onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-3.5" />
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={activityPage >= activityPages || activityQuery.isFetching}
                      onClick={() => setActivityPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Confirmation Dialog */}
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
              This ends every active session across all devices, browsers, and applications,
              including this one. You will need to sign in again to continue.
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
