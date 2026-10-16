import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  Shield,
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
      // e.g. "Cannot remove the last owner" — the select stays on the old value.
      toast.error(getErrorMessage(err, 'Failed to change role'))
    } finally {
      setBusyId(null)
    }
  }

  // ---- App roles ------------------------------------------------------------

  function openAppRolesDialog(user: AdminUser) {
    setAppRolesTarget(user)
    setAppRolesDraft({ ...(user.app_roles ?? {}) })
  }

  function toggleAppRole(clientId: string, role: string, on: boolean) {
    setAppRolesDraft((draft) => {
      const current = draft[clientId] ?? []
      const next = on ? [...current, role] : current.filter((r) => r !== role)
      return { ...draft, [clientId]: next }
    })
  }

  async function submitAppRoles() {
    if (!appRolesTarget) return
    const original = appRolesTarget.app_roles ?? {}
    const changed = clientsWithRoles.filter(
      (c) => !sameRoles(original[c.client_id], appRolesDraft[c.client_id])
    )
    if (changed.length === 0) {
      setAppRolesTarget(null)
      return
    }
    setSavingAppRoles(true)
    setBusyId(appRolesTarget.id)
    try {
      for (const c of changed) {
        await apiClient.put(
          `/admin/users/${appRolesTarget.id}/app-roles/${encodeURIComponent(c.client_id)}`,
          { roles: appRolesDraft[c.client_id] ?? [] }
        )
      }
      toast.success('Application roles updated')
      setAppRolesTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update application roles'))
    } finally {
      await invalidateUsers()
      setSavingAppRoles(false)
      setBusyId(null)
    }
  }

  // ---- Password reset -------------------------------------------------------

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
    setBusyId(resetTarget.id)
    try {
      const { data } = await apiClient.post<ResetResult>(
        `/admin/users/${resetTarget.id}/reset-password`
      )
      if (data.reset_link) {
        // Email could not be sent (or is disabled): hand the link over manually.
        setResetResult(data)
      } else {
        toast.success(
          data.email_sent ? `Reset link emailed to ${resetTarget.email}` : data.message
        )
        setResetTarget(null)
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reset password'))
    } finally {
      setResetting(false)
      setBusyId(null)
    }
  }

  // ---- Roles ----------------------------------------------------------------

  async function createRole(e: React.FormEvent) {
    e.preventDefault()
    const name = newRoleName.trim().toLowerCase()
    if (!name) {
      toast.error('Role name is required')
      return
    }
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
    <div className="relative min-h-svh">
      <div className="aurora-bg" aria-hidden />
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <Link to="/account" className="flex items-center gap-2 text-[#ccd6f6]">
          <Shield className="size-5 text-[#64ffda]" />
          <span className="font-semibold">
            Auth<span className="gradient-text">SSO</span> Admin
          </span>
        </Link>
        <Button asChild size="sm">
          <Link to="/account">Back to account</Link>
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
        <div className="flex flex-wrap gap-2 rounded-lg border border-[rgba(100,255,218,0.12)] bg-[#112240]/50 p-1 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors',
                tab === key
                  ? 'bg-[#64ffda]/15 text-[#64ffda]'
                  : 'text-[#8892b0] hover:text-[#ccd6f6]'
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Users className="size-5 text-[#64ffda]" />
                    Users
                  </CardTitle>
                  <CardDescription>
                    Total accounts: <span className="text-[#64ffda]">{total}</span>
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => usersQuery.refetch()}
                  disabled={usersLoading}
                >
                  <RefreshCw
                    className={`size-4 ${usersLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-[rgba(100,255,218,0.1)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0a192f]/60 text-[#8892b0]">
                      <tr>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Email</th>
                        <th className="text-left p-3 font-medium">Role</th>
                        <th className="text-left p-3 font-medium">App roles</th>
                        <th className="text-left p-3 font-medium">Verified</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const appRoles = Object.entries(u.app_roles ?? {})
                        return (
                          <tr
                            key={u.id}
                            className="border-t border-[rgba(100,255,218,0.08)] hover:bg-[#112240]/80"
                          >
                            <td className="p-3 text-[#ccd6f6]">{u.name}</td>
                            <td className="p-3 text-[#8892b0]">{u.email}</td>
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
                                <span className="text-[#8892b0]">—</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {appRoles.map(([app, list]) => (
                                    <span
                                      key={app}
                                      className="rounded-full border border-[rgba(100,255,218,0.2)] px-2 py-0.5 text-[#8892b0]"
                                    >
                                      <span className="text-[#ccd6f6]">{app}</span>:{' '}
                                      {list.join(', ')}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              {u.email_verified ? (
                                <span className="text-[#64ffda]">yes</span>
                              ) : (
                                <span className="text-amber-300">no</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={busyId === u.id}
                                  onClick={() => openEditDialog(u)}
                                >
                                  <Pencil className="size-3.5" />
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
                                  <Boxes className="size-3.5" />
                                  App roles
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => showActivity(u)}
                                >
                                  <History className="size-3.5" />
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
                          <td colSpan={6} className="p-6 text-center text-amber-300">
                            {getErrorMessage(usersQuery.error, 'Failed to load users')}
                          </td>
                        </tr>
                      )}
                      {usersQuery.isSuccess && users.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-[#8892b0]">
                            No users yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[#8892b0]">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={page <= 1 || usersLoading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      disabled={page >= totalPages || usersLoading}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="size-4" />
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BadgeCheck className="size-5 text-[#64ffda]" />
                  Create role
                </CardTitle>
                <CardDescription>
                  Global roles. Lowercase letters, numbers, underscores; must start with a
                  letter. App-specific roles are defined per application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createRole} className="space-y-4">
                  <div className="space-y-2">
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
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Existing roles</CardTitle>
                  <CardDescription>
                    {roles.length} role{roles.length === 1 ? '' : 's'}
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => rolesQuery.refetch()} disabled={rolesLoading}>
                  <RefreshCw
                    className={`size-4 ${rolesLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {roles.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-md border border-[rgba(100,255,218,0.1)] bg-[#0a192f]/40 px-3 py-2"
                    >
                      <span className="text-[#64ffda] font-medium">{r.name}</span>
                      <span className="text-xs text-[#8892b0] font-mono">
                        {r.id.slice(-6)}
                      </span>
                    </li>
                  ))}
                  {rolesQuery.isSuccess && roles.length === 0 && (
                    <li className="text-sm text-[#8892b0]">No roles yet</li>
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

      <Dialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) closeEditDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>
              Update email and verification for{' '}
              <span className="text-[#ccd6f6]">{editTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="admin-edit-email">Email</Label>
              <Input
                id="admin-edit-email"
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#8892b0]">
              <Checkbox
                checked={editVerified}
                onCheckedChange={(v) => setEditVerified(v === true)}
              />
              Email verified
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
              Roles for <span className="text-[#ccd6f6]">{appRolesTarget?.name}</span> (
              {appRolesTarget?.email}) in each application. Apps may take up to 15 minutes
              to see the change in tokens.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {clientsWithRoles.map((c) => (
              <div
                key={c.client_id}
                className="rounded-lg border border-[rgba(100,255,218,0.1)] bg-[#0a192f]/40 px-4 py-3"
              >
                <p className="text-sm text-[#ccd6f6]">
                  {c.name}{' '}
                  <span className="font-mono text-xs text-[#8892b0]">{c.client_id}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                  {c.roles.map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-2 text-sm text-[#8892b0]"
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

      <Dialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) closeResetDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              {resetResult ? (
                resetResult.message
              ) : (
                <>
                  Invalidate the current password of{' '}
                  <span className="text-[#ccd6f6]">{resetTarget?.name}</span> (
                  {resetTarget?.email}), sign them out everywhere and email them a
                  single-use reset link.
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
                  ? 'The link was also emailed to the user.'
                  : 'The email could not be sent — share this link with the user over a trusted channel.'
              } It works only once and expires soon; anyone with it can set the password.`}
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
