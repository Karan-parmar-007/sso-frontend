import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import {
  Shield,
  Users,
  RefreshCw,
  Dices,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Pencil,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

type AdminUser = {
  id: string
  name: string
  email: string
  email_verified: boolean
  role_name?: string | null
  created_at?: string | null
}

type AdminRole = {
  id: string
  name: string
  created_at?: string | null
  updated_at?: string | null
}

type TabKey = 'users' | 'roles'

const PAGE_SIZE = 10

function generateRandomPassword(length = 16) {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const bytes = crypto.getRandomValues(new Uint32Array(length))
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join('')
}

export default function AdminPage() {
  const [tab, setTab] = useState<TabKey>('users')

  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [usersLoading, setUsersLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [roles, setRoles] = useState<AdminRole[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)
  const [newRoleName, setNewRoleName] = useState('')
  const [creatingRole, setCreatingRole] = useState(false)

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editVerified, setEditVerified] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const loadUsers = useCallback(async (pageNum: number) => {
    setUsersLoading(true)
    try {
      const { data } = await apiClient.get<{
        total_count: number
        page: number
        page_size: number
        total_pages: number
        users: AdminUser[]
      }>('/admin/users', {
        params: { page: pageNum, page_size: PAGE_SIZE },
      })
      setUsers(data.users)
      setTotal(data.total_count)
      setPage(data.page)
      setTotalPages(data.total_pages)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load users'))
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const loadRoles = useCallback(async () => {
    setRolesLoading(true)
    try {
      const { data } = await apiClient.get<{
        total_count: number
        roles: AdminRole[]
      }>('/admin/roles')
      setRoles(data.roles)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load roles'))
    } finally {
      setRolesLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers(1)
    loadRoles()
  }, [loadUsers, loadRoles])

  function openResetDialog(user: AdminUser) {
    setResetTarget(user)
    setResetPassword('')
    setSendEmail(false)
  }

  function closeResetDialog() {
    if (resetting) return
    setResetTarget(null)
    setResetPassword('')
    setSendEmail(false)
  }

  function openEditDialog(user: AdminUser) {
    setEditTarget(user)
    setEditEmail(user.email)
    setEditVerified(user.email_verified)
  }

  function closeEditDialog() {
    if (savingEdit) return
    setEditTarget(null)
    setEditEmail('')
    setEditVerified(false)
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
      await loadUsers(page)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update user'))
    } finally {
      setSavingEdit(false)
      setBusyId(null)
    }
  }

  async function changeRole(userId: string, role_name: string) {
    setBusyId(userId)
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role_name })
      toast.success(`Role updated to ${role_name}`)
      await loadUsers(page)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function submitResetPassword() {
    if (!resetTarget) return
    if (!resetPassword || resetPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setResetting(true)
    setBusyId(resetTarget.id)
    try {
      const { data } = await apiClient.post<{
        message: string
        email_sent: boolean
        temporary_password?: string | null
      }>(`/admin/users/${resetTarget.id}/reset-password`, {
        password: resetPassword,
        send_email: sendEmail,
      })

      if (data.email_sent) {
        toast.success('Password reset — email sent to user')
      } else if (data.temporary_password) {
        toast.success(`Password reset. New password: ${data.temporary_password}`)
      } else {
        toast.success(data.message)
      }

      setResetTarget(null)
      setResetPassword('')
      setSendEmail(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setResetting(false)
      setBusyId(null)
    }
  }

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
      await loadRoles()
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
        <div className="flex gap-2 rounded-lg border border-[rgba(100,255,218,0.12)] bg-[#112240]/50 p-1 w-fit">
          <button
            type="button"
            onClick={() => setTab('users')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors',
              tab === 'users'
                ? 'bg-[#64ffda]/15 text-[#64ffda]'
                : 'text-[#8892b0] hover:text-[#ccd6f6]'
            )}
          >
            <Users className="size-4" />
            Users
          </button>
          <button
            type="button"
            onClick={() => setTab('roles')}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors',
              tab === 'roles'
                ? 'bg-[#64ffda]/15 text-[#64ffda]'
                : 'text-[#8892b0] hover:text-[#ccd6f6]'
            )}
          >
            <BadgeCheck className="size-4" />
            Roles
          </button>
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
                  onClick={() => loadUsers(page)}
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
                        <th className="text-left p-3 font-medium">Verified</th>
                        <th className="text-left p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr
                          key={u.id}
                          className="border-t border-[rgba(100,255,218,0.08)] hover:bg-[#112240]/80"
                        >
                          <td className="p-3 text-[#ccd6f6]">{u.name}</td>
                          <td className="p-3 text-[#8892b0]">{u.email}</td>
                          <td className="p-3">
                            <select
                              className="h-8 rounded-md border border-[rgba(100,255,218,0.2)] bg-[#0a192f] px-2 text-[#64ffda] outline-none focus:ring-2 focus:ring-[#64ffda]/30"
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
                                variant="default"
                                disabled={busyId === u.id}
                                onClick={() => openResetDialog(u)}
                              >
                                Reset password
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!usersLoading && users.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-6 text-center text-[#8892b0]"
                          >
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
                      onClick={() => loadUsers(page - 1)}
                    >
                      <ChevronLeft className="size-4" />
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      disabled={page >= totalPages || usersLoading}
                      onClick={() => loadUsers(page + 1)}
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
                  Lowercase letters, numbers, underscores. Must start with a letter.
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
                <Button size="sm" onClick={loadRoles} disabled={rolesLoading}>
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
                  {!rolesLoading && roles.length === 0 && (
                    <li className="text-sm text-[#8892b0]">No roles yet</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
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
        open={Boolean(resetTarget)}
        onOpenChange={(open) => {
          if (!open) closeResetDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for{' '}
              <span className="text-[#ccd6f6]">{resetTarget?.name}</span> (
              {resetTarget?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label htmlFor="admin-reset-password">New password</Label>
              <PasswordInput
                id="admin-reset-password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                minLength={8}
                autoComplete="new-password"
                placeholder="Enter manually or generate"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => setResetPassword(generateRandomPassword())}
              >
                <Dices className="size-4" />
                Generate random password
              </Button>
            </div>

            <label className="flex items-center gap-2 text-sm text-[#8892b0]">
              <Checkbox
                checked={sendEmail}
                onCheckedChange={(v) => setSendEmail(v === true)}
              />
              Email this password to the user
            </label>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeResetDialog} disabled={resetting}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={submitResetPassword}
              disabled={resetting || resetPassword.length < 8}
            >
              {resetting ? 'Resetting…' : 'Reset password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
