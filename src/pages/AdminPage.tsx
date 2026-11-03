import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Pencil,
  AppWindow,
  ScrollText,
  Boxes,
  History,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
import { ApplicationsPanel } from '@/components/admin/ApplicationsPanel'
import { AuditLogPanel } from '@/components/admin/AuditLogPanel'
import { SecretValue } from '@/components/admin/SecretValue'
import { useAdminClients, useAdminRoles, useAdminUsers } from '@/components/admin/queries'
import { ADMIN_KEYS, selectClass, type AdminUser } from '@/components/admin/types'
import { cn } from '@/lib/utils'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

type TabKey = 'users' | 'roles' | 'apps' | 'audit'

const TABS: { key: TabKey; label: string; icon: typeof Users }[] = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'roles', label: 'Roles', icon: BadgeCheck },
  { key: 'apps', label: 'Applications', icon: AppWindow },
  { key: 'audit', label: 'Audit log', icon: ScrollText },
]

const PAGE_SIZE = 10

type ResetResult = { message: string; email_sent: boolean; reset_link?: string | null }

function sameRoles(a: string[] = [], b: string[] = []) {
  return a.length === b.length && a.every((r) => b.includes(r))
}

export default function AdminPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabKey>('users')
  const [auditUserId, setAuditUserId] = useState('')

  const [page, setPage] = useState(1)
  const usersQuery = useAdminUsers(page, PAGE_SIZE)
  const users = usersQuery.data?.users ?? []
  const total = usersQuery.data?.total_count ?? 0
  const totalPages = Math.max(1, usersQuery.data?.total_pages ?? 1)
  const usersLoading = usersQuery.isFetching

  const rolesQuery = useAdminRoles()
  const roles = rolesQuery.data ?? []
  const rolesLoading = rolesQuery.isFetching

  const clientsQuery = useAdminClients()
  const clientsWithRoles = (clientsQuery.data ?? []).filter((c) => c.roles.length > 0)

  const [busyId, setBusyId] = useState<string | null>(null)
  const [newRoleName, setNewRoleName] = useState('')
  const [creatingRole, setCreatingRole] = useState(false)

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [resetResult, setResetResult] = useState<ResetResult | null>(null)
  const [resetting, setResetting] = useState(false)

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editVerified, setEditVerified] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const [appRolesTarget, setAppRolesTarget] = useState<AdminUser | null>(null)
  const [appRolesDraft, setAppRolesDraft] = useState<Record<string, string[]>>({})
  const [savingAppRoles, setSavingAppRoles] = useState(false)

  function invalidateUsers() {
    return queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.allUsers })
  }

  function showActivity(user: AdminUser) {
    setAuditUserId(user.id)
    setTab('audit')
  }

  // ---- Edit user ----------------------------------------------------------

  function openEditDialog(user: AdminUser) {
    setEditTarget(user)
    setEditEmail(user.email)
    setEditVerified(user.email_verified)
  }

  function closeEditDialog() {
    if (savingEdit) return
    setEditTarget(null)
  }

  async function submitEditUser() {
    if (!editTarget) return
    const email = editEmail.trim().toLowerCase()
    if (!email) {
      toast.error('Email is required')
      return
    }
    setSavingEdit(true)
    setBusyId(editTarget.id)
    try {
      await apiClient.patch(`/admin/users/${editTarget.id}`, {
        email,
        email_verified: editVerified,
      })
      toast.success('User updated')
      setEditTarget(null)
      await invalidateUsers()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update user'))
    } finally {
      setSavingEdit(false)
      setBusyId(null)
    }
  }

  // ---- Global role ----------------------------------------------------------

  async function changeRole(userId: string, role_name: string) {
    setBusyId(userId)
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role_name })
      toast.success(`Role updated to ${role_name}`)
      await invalidateUsers()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to change role'))
      await invalidateUsers()
    } finally {
      setBusyId(null)
    }
  }

  // ---- App roles ------------------------------------------------------------

  function openAppRolesDialog(user: AdminUser) {
    setAppRolesTarget(user)
    const initial: Record<string, string[]> = {}
    for (const c of clientsWithRoles) {
      initial[c.client_id] = [...(user.app_roles?.[c.client_id] ?? [])]
    }
    setAppRolesDraft(initial)
  }

  function toggleAppRole(clientId: string, role: string, checked: boolean) {
    setAppRolesDraft((prev) => {
      const current = prev[clientId] ?? []
      const next = checked
        ? Array.from(new Set([...current, role]))
        : current.filter((r) => r !== role)
      return { ...prev, [clientId]: next }
    })
  }

  async function submitAppRoles() {
    if (!appRolesTarget) return
    setSavingAppRoles(true)
    try {
      const original = appRolesTarget.app_roles ?? {}
      const updates = clientsWithRoles.map(async (c) => {
        const next = appRolesDraft[c.client_id] ?? []
        const prev = original[c.client_id] ?? []
        if (sameRoles(prev, next)) return
        await apiClient.put(
          `/admin/users/${appRolesTarget.id}/app-roles/${encodeURIComponent(c.client_id)}`,
          { roles: next }
        )
      })
      await Promise.all(updates)
      toast.success('Application roles updated')
      setAppRolesTarget(null)
      await invalidateUsers()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update application roles'))
    } finally {
      setSavingAppRoles(false)
    }
  }

  // ---- Reset password -------------------------------------------------------

  function openResetDialog(user: AdminUser) {
    setResetTarget(user)
    setResetResult(null)
  }

  function closeResetDialog() {
    if (resetting) return
    setResetTarget(null)
    setResetResult(null)
  }

  async function submitResetPassword() {
    if (!resetTarget) return
    setResetting(true)
    try {
      const { data } = await apiClient.post<ResetResult>(
        `/admin/users/${resetTarget.id}/reset-password`
      )
      setResetResult(data)
      toast.success(data.message)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reset password'))
    } finally {
      setResetting(false)
    }
  }

  // ---- Roles tab ------------------------------------------------------------

  async function createRole(e: React.FormEvent) {
    e.preventDefault()
    const name = newRoleName.trim().toLowerCase()
    if (!name) return
    setCreatingRole(true)
    try {
      await apiClient.post('/admin/roles', { name })
      toast.success(`Role "${name}" created`)
      setNewRoleName('')
      await queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.roles })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create role'))
    } finally {
      setCreatingRole(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col justify-between transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between gap-4">
        <Link
          to="/account"
          className="group inline-flex items-center gap-2 font-hand text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight hover:opacity-85 transition-opacity"
        >
          <KeyMark className="size-5 sm:size-6 text-[var(--forest)] transition-transform group-hover:rotate-12" />
          <span>karan</span>
          <span className="hidden sm:inline-block font-sans text-[11px] uppercase tracking-wider font-semibold text-[var(--pencil-light)] ml-1 border-l border-[var(--paper-border)] pl-2">
            Admin Console
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Button asChild size="sm" variant="outline">
            <Link to="/account">
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">My Account</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-6 space-y-6">
        {/* Notebook tab switches */}
        <div className="flex flex-wrap gap-1.5 rounded-full border border-[var(--paper-border-strong)] bg-[var(--paper)] p-1.5 w-fit shadow-xs">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                tab === key
                  ? 'bg-[var(--forest)] text-[#ffffff] shadow-xs'
                  : 'text-[var(--pencil)] hover:text-[var(--ink)] hover:bg-[var(--forest-tint)]'
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <span className="desk-sheet-tape" aria-hidden />
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                <div>
                  <p className="font-hand text-xl font-semibold text-[var(--forest)] leading-none">
                    directory
                  </p>
                  <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                    <Users className="size-5 text-[var(--forest)]" />
                    User accounts
                  </CardTitle>
                  <CardDescription>
                    Total registered accounts: <strong className="text-[var(--forest)]">{total}</strong>
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => usersQuery.refetch()}
                  disabled={usersLoading}
                >
                  <RefreshCw
                    className={`size-3.5 ${usersLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-[var(--paper-border)] bg-[var(--paper)]">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="border-b border-[var(--paper-border)] bg-[var(--forest-tint-subtle)] text-[var(--pencil)]">
                      <tr>
                        <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">Name</th>
                        <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">Email</th>
                        <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">Global Role</th>
                        <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">App Roles</th>
                        <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">Verified</th>
                        <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--paper-border)]">
                      {users.map((u) => {
                        const appRoles = Object.entries(u.app_roles ?? {})
                        return (
                          <tr
                            key={u.id}
                            className="hover:bg-[var(--forest-tint-subtle)] transition-colors"
                          >
                            <td className="p-3 font-semibold text-[var(--ink)]">{u.name}</td>
                            <td className="p-3 text-[var(--pencil)] font-mono text-xs">{u.email}</td>
                            <td className="p-3">
                              <select
                                className={selectClass}
                                value={u.role_name || ''}
                                disabled={busyId === u.id || rolesLoading}
                                onChange={(e) => {
                                  const next = e.target.value
                                  if (next && next !== u.role_name) {
                                    changeRole(u.id, next)
                                  }
                                }}
                              >
                                {roles.map((r) => (
                                  <option key={r.id} value={r.name}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-xs">
                              {appRoles.length === 0 ? (
                                <span className="text-[var(--pencil-light)]">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {appRoles.map(([app, list]) => (
                                    <span
                                      key={app}
                                      className="rounded-full border border-[var(--paper-border-strong)] bg-[var(--paper)] px-2 py-0.5 text-[10px] text-[var(--pencil)]"
                                    >
                                      <strong className="text-[var(--ink)]">{app}</strong>: {list.join(', ')}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              {u.email_verified ? (
                                <span className="inline-flex items-center gap-1 text-[var(--forest)] font-medium text-xs">
                                  <CheckCircle2 className="size-3.5" />
                                  yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[var(--amber-text)] font-medium text-xs">
                                  <XCircle className="size-3.5" />
                                  no
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busyId === u.id}
                                  onClick={() => openEditDialog(u)}
                                >
                                  <Pencil className="size-3" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={busyId === u.id || clientsWithRoles.length === 0}
                                  title={
                                    clientsWithRoles.length === 0
                                      ? 'No application defines roles yet'
                                      : undefined
                                  }
                                  onClick={() => openAppRolesDialog(u)}
                                >
                                  <Boxes className="size-3" />
                                  App roles
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => showActivity(u)}
                                >
                                  <History className="size-3" />
                                  Activity
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  disabled={busyId === u.id}
                                  onClick={() => openResetDialog(u)}
                                >
                                  Reset password
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {usersQuery.isError && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-xs text-[var(--terracotta)]">
                            {getErrorMessage(usersQuery.error, 'Failed to load users')}
                          </td>
                        </tr>
                      )}
                      {usersQuery.isSuccess && users.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-xs text-[var(--pencil)]">
                            No users registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-[var(--pencil)]">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1 || usersLoading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-3.5" />
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages || usersLoading}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {tab === 'roles' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <Card>
              <span className="desk-sheet-tape" aria-hidden />
              <CardHeader className="pt-2">
                <p className="font-hand text-xl font-semibold text-[var(--forest)] leading-none">
                  new definition
                </p>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BadgeCheck className="size-5 text-[var(--forest)]" />
                  Create global role
                </CardTitle>
                <CardDescription>
                  Global roles apply across the SSO service. Lowercase letters, numbers, underscores; must start with a letter.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createRole} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="role-name">Role name</Label>
                    <Input
                      id="role-name"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. editor"
                      pattern="^[a-z][a-z0-9_]*$"
                      required
                    />
                  </div>
                  <Button type="submit" variant="default" disabled={creatingRole}>
                    {creatingRole ? 'Creating…' : 'Create role'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <span className="desk-sheet-tape" aria-hidden />
              <CardHeader className="flex flex-row items-center justify-between gap-4 pt-2">
                <div>
                  <p className="font-hand text-xl font-semibold text-[var(--forest)] leading-none">
                    active list
                  </p>
                  <CardTitle className="text-2xl">Existing roles</CardTitle>
                  <CardDescription>
                    {roles.length} role{roles.length === 1 ? '' : 's'} registered
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => rolesQuery.refetch()} disabled={rolesLoading}>
                  <RefreshCw
                    className={`size-3.5 ${rolesLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {roles.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--paper-border)] bg-[var(--paper)] px-3.5 py-2.5 text-xs sm:text-sm"
                    >
                      <span className="font-semibold text-[var(--forest)]">{r.name}</span>
                      <span className="text-xs text-[var(--pencil-light)] font-mono">
                        {r.id.slice(-6)}
                      </span>
                    </li>
                  ))}
                  {rolesQuery.isSuccess && roles.length === 0 && (
                    <li className="text-xs text-[var(--pencil)]">No roles created yet.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {tab === 'apps' && <ApplicationsPanel />}

        {tab === 'audit' && (
          <AuditLogPanel userId={auditUserId} onUserIdChange={setAuditUserId} />
        )}
      </main>

      {/* Edit User Dialog */}
      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) closeEditDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user details</DialogTitle>
            <DialogDescription>
              Update email address and verification status for{' '}
              <strong className="text-[var(--ink)] font-semibold">{editTarget?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="admin-edit-email">Email</Label>
              <Input
                id="admin-edit-email"
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[var(--pencil)] cursor-pointer">
              <Checkbox
                checked={editVerified}
                onCheckedChange={(v) => setEditVerified(v === true)}
              />
              Mark email as verified
            </label>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeEditDialog} disabled={savingEdit}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={submitEditUser}
              disabled={savingEdit || !editEmail.trim()}
            >
              {savingEdit ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* App Roles Dialog */}
      <Dialog
        open={Boolean(appRolesTarget)}
        onOpenChange={(open) => {
          if (!open && !savingAppRoles) setAppRolesTarget(null)
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application roles</DialogTitle>
            <DialogDescription>
              Assign roles for <strong className="text-[var(--ink)]">{appRolesTarget?.name}</strong> (
              {appRolesTarget?.email}) in each connected application.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            {clientsWithRoles.map((c) => (
              <div
                key={c.client_id}
                className="rounded-xl border border-[var(--paper-border)] bg-[var(--paper)] p-3.5"
              >
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {c.name}{' '}
                  <span className="font-mono text-xs text-[var(--pencil-light)]">({c.client_id})</span>
                </p>
                <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2">
                  {c.roles.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-2 text-xs text-[var(--pencil)] cursor-pointer"
                    >
                      <Checkbox
                        checked={(appRolesDraft[c.client_id] ?? []).includes(role)}
                        onCheckedChange={(v) => toggleAppRole(c.client_id, role, v === true)}
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setAppRolesTarget(null)}
              disabled={savingAppRoles}
            >
              Cancel
            </Button>
            <Button variant="default" onClick={submitAppRoles} disabled={savingAppRoles}>
              {savingAppRoles ? 'Saving…' : 'Save roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) closeResetDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset user password</DialogTitle>
            <DialogDescription>
              {resetResult ? (
                resetResult.message
              ) : (
                <>
                  Invalidate the current password of{' '}
                  <strong className="text-[var(--ink)]">{resetTarget?.name}</strong> (
                  {resetTarget?.email}), sign them out everywhere, and generate a single-use reset link.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {resetResult?.reset_link && (
            <SecretValue
              label="Reset link"
              value={resetResult.reset_link}
              warning={`${
                resetResult.email_sent
                  ? 'The link was emailed to the user.'
                  : 'The email could not be sent — copy this link and share it securely with the user.'
              } It works only once and expires soon.`}
            />
          )}

          <DialogFooter>
            {resetResult ? (
              <Button variant="default" onClick={closeResetDialog}>
                Done
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={closeResetDialog} disabled={resetting}>
                  Cancel
                </Button>
                <Button variant="default" onClick={submitResetPassword} disabled={resetting}>
                  {resetting ? 'Resetting…' : 'Reset & send link'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
