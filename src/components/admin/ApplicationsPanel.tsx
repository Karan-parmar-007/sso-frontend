import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { AppWindow, KeyRound, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SecretValue } from '@/components/admin/SecretValue'
import { useAdminClients } from '@/components/admin/queries'
import {
  ADMIN_KEYS,
  SUPPORTED_SCOPES,
  parseList,
  textareaClass,
  type AdminClient,
  type AdminClientWithSecret,
} from '@/components/admin/types'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

type FormState = {
  client_id: string
  name: string
  first_party: boolean
  confidential: boolean
  roles: string
  redirect_uris: string
  post_logout_redirect_uris: string
  allowed_scopes: string[]
}

const EMPTY_FORM: FormState = {
  client_id: '',
  name: '',
  first_party: false,
  confidential: false,
  roles: '',
  redirect_uris: '',
  post_logout_redirect_uris: '',
  allowed_scopes: ['openid', 'profile', 'email'],
}

function formFromClient(c: AdminClient): FormState {
  return {
    client_id: c.client_id,
    name: c.name,
    first_party: c.first_party,
    confidential: c.confidential,
    roles: c.roles.join(', '),
    redirect_uris: c.redirect_uris.join('\n'),
    post_logout_redirect_uris: c.post_logout_redirect_uris.join('\n'),
    allowed_scopes: c.allowed_scopes,
  }
}

export function ApplicationsPanel() {
  const queryClient = useQueryClient()
  const clientsQuery = useAdminClients()
  const clients = clientsQuery.data ?? []

  // null = closed; 'new' = create; otherwise the client being edited
  const [editing, setEditing] = useState<AdminClient | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [secret, setSecret] = useState<{ clientId: string; value: string } | null>(null)
  const [rotateTarget, setRotateTarget] = useState<AdminClient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminClient | null>(null)
  const [busy, setBusy] = useState(false)

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.clients })
    // Role changes can prune users' app roles.
    queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.allUsers })
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditing('new')
  }

  function openEdit(c: AdminClient) {
    setForm(formFromClient(c))
    setEditing(c)
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    const body = {
      name: form.name.trim(),
      first_party: form.first_party,
      roles: parseList(form.roles).map((r) => r.toLowerCase()),
      redirect_uris: parseList(form.redirect_uris),
      post_logout_redirect_uris: parseList(form.post_logout_redirect_uris),
      allowed_scopes: Array.from(new Set(['openid', ...form.allowed_scopes])),
    }
    setSaving(true)
    try {
      if (editing === 'new') {
        const { data } = await apiClient.post<AdminClientWithSecret>('/admin/clients', {
          ...body,
          client_id: form.client_id.trim().toLowerCase(),
          confidential: form.confidential,
        })
        toast.success(`Application "${data.name}" created`)
        if (data.client_secret) {
          setSecret({ clientId: data.client_id, value: data.client_secret })
        }
      } else {
        await apiClient.patch(`/admin/clients/${encodeURIComponent(editing.client_id)}`, body)
        const removed = editing.roles.filter((r) => !body.roles.includes(r))
        toast.success(
          removed.length
            ? `Application updated — removed role(s) ${removed.join(', ')} were revoked from users`
            : 'Application updated'
        )
      }
      setEditing(null)
      invalidate()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save application'))
    } finally {
      setSaving(false)
    }
  }

  async function rotateSecret() {
    if (!rotateTarget) return
    setBusy(true)
    try {
      const { data } = await apiClient.post<AdminClientWithSecret>(
        `/admin/clients/${encodeURIComponent(rotateTarget.client_id)}/rotate-secret`
      )
      setRotateTarget(null)
      if (data.client_secret) {
        setSecret({ clientId: data.client_id, value: data.client_secret })
      }
      invalidate()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to rotate secret'))
    } finally {
      setBusy(false)
    }
  }

  async function deleteClient() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      const { data } = await apiClient.delete<{ message: string }>(
        `/admin/clients/${encodeURIComponent(deleteTarget.client_id)}`
      )
      toast.success(data.message)
      setDeleteTarget(null)
      invalidate()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete application'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <AppWindow className="size-5 text-[#64ffda]" />
              Applications
            </CardTitle>
            <CardDescription>
              First-party apps and OAuth/OIDC clients, and the roles each app defines.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => clientsQuery.refetch()}
              disabled={clientsQuery.isFetching}
            >
              <RefreshCw
                className={`size-4 ${clientsQuery.isFetching ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button size="sm" variant="default" onClick={openCreate}>
              <Plus className="size-4" />
              New application
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {clients.map((c) => (
            <div
              key={c.client_id}
              className="flex flex-col gap-3 rounded-lg border border-[rgba(100,255,218,0.1)] bg-[#0a192f]/40 px-4 py-3 lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[#ccd6f6]">{c.name}</p>
                  <span className="font-mono text-xs text-[#8892b0]">{c.client_id}</span>
                  {c.first_party && (
                    <span className="rounded-full border border-[#64ffda]/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#64ffda]">
                      First-party
                    </span>
                  )}
                  <span className="rounded-full border border-[rgba(100,255,218,0.2)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#8892b0]">
                    {c.confidential ? 'Confidential' : 'Public'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8892b0]">
                  <span>
                    Roles:{' '}
                    <span className="text-[#ccd6f6]">
                      {c.roles.length ? c.roles.join(', ') : '—'}
                    </span>
                  </span>
                  <span>
                    Scopes: <span className="text-[#ccd6f6]">{c.allowed_scopes.join(' ')}</span>
                  </span>
                </div>
                {c.redirect_uris.length > 0 && (
                  <ul className="space-y-0.5 text-xs text-[#8892b0]">
                    {c.redirect_uris.map((uri) => (
                      <li key={uri} className="font-mono break-all">
                        {uri}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRotateTarget(c)}>
                  <KeyRound className="size-3.5" />
                  {c.confidential ? 'Rotate secret' : 'Create secret'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(c)}>
                  <Trash2 className="size-3.5 text-red-300" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {clientsQuery.isError && (
            <p className="text-sm text-amber-300">
              {getErrorMessage(clientsQuery.error, 'Failed to load applications')}
            </p>
          )}
          {clientsQuery.isSuccess && clients.length === 0 && (
            <p className="text-sm text-[#8892b0]">No applications yet.</p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setEditing(null)
        }}
      >
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing === 'new' ? 'New application' : `Edit ${form.name || form.client_id}`}
            </DialogTitle>
            <DialogDescription>
              Redirect URIs must be absolute https URLs (exact match). One per line.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client-id">Client ID</Label>
                <Input
                  id="client-id"
                  required
                  disabled={editing !== 'new'}
                  pattern="^[a-z][a-z0-9_\-]{1,39}$"
                  title="2–40 chars: lowercase letters, digits, _ or -, starting with a letter"
                  placeholder="e.g. familyos"
                  value={form.client_id}
                  onChange={(e) => update('client_id', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-name">Name</Label>
                <Input
                  id="client-name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex items-center gap-2 text-sm text-[#8892b0]">
                <Checkbox
                  checked={form.first_party}
                  onCheckedChange={(v) => update('first_party', v === true)}
                />
                First-party (no consent screen)
              </label>
              {editing === 'new' && (
                <label className="flex items-center gap-2 text-sm text-[#8892b0]">
                  <Checkbox
                    checked={form.confidential}
                    onCheckedChange={(v) => update('confidential', v === true)}
                  />
                  Confidential (has a client secret)
                </label>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-roles">App roles</Label>
              <Input
                id="client-roles"
                placeholder="admin, editor"
                value={form.roles}
                onChange={(e) => update('roles', e.target.value)}
              />
              <p className="text-xs text-[#8892b0]">
                Comma-separated. Removing a role revokes it from every user.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-redirects">Redirect URIs</Label>
              <textarea
                id="client-redirects"
                className={textareaClass}
                placeholder="https://app.example.com/callback"
                value={form.redirect_uris}
                onChange={(e) => update('redirect_uris', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-logout-redirects">Post-logout redirect URIs</Label>
              <textarea
                id="client-logout-redirects"
                className={textareaClass}
                placeholder="https://app.example.com/"
                value={form.post_logout_redirect_uris}
                onChange={(e) => update('post_logout_redirect_uris', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Allowed scopes</Label>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {SUPPORTED_SCOPES.map((scope) => (
                  <label
                    key={scope}
                    className="flex items-center gap-2 font-mono text-xs text-[#8892b0]"
                  >
                    <Checkbox
                      checked={scope === 'openid' || form.allowed_scopes.includes(scope)}
                      // OIDC requires openid; the API rejects clients without it.
                      disabled={scope === 'openid'}
                      onCheckedChange={(v) =>
                        update(
                          'allowed_scopes',
                          v === true
                            ? [...form.allowed_scopes, scope]
                            : form.allowed_scopes.filter((s) => s !== scope)
                        )
                      }
                    />
                    {scope}
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="default" disabled={saving}>
                {saving ? 'Saving…' : editing === 'new' ? 'Create application' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rotateTarget !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setRotateTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {rotateTarget?.confidential ? 'Rotate client secret' : 'Create client secret'}
            </DialogTitle>
            <DialogDescription>
              {rotateTarget?.confidential
                ? 'The current secret stops working immediately. Update the application with the new secret right away.'
                : 'This makes the application a confidential client: it must authenticate with the secret from now on.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" disabled={busy} onClick={() => setRotateTarget(null)}>
              Cancel
            </Button>
            <Button variant="default" disabled={busy} onClick={rotateSecret}>
              {busy ? 'Working…' : 'Generate new secret'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleteTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>
              The application <span className="font-mono">{deleteTarget?.client_id}</span>{' '}
              can no longer sign users in, and every user loses their roles in it. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" disabled={busy} onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={busy} onClick={deleteClient}>
              {busy ? 'Deleting…' : 'Delete application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={secret !== null}
        onOpenChange={(open) => {
          if (!open) setSecret(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Client secret</DialogTitle>
            <DialogDescription>
              For <span className="font-mono">{secret?.clientId}</span>.
            </DialogDescription>
          </DialogHeader>
          {secret && (
            <SecretValue
              label="Client secret"
              value={secret.value}
              warning="This secret is shown only once. Copy it now and store it securely — it cannot be retrieved later (rotate to get a new one)."
            />
          )}
          <DialogFooter>
            <Button variant="default" onClick={() => setSecret(null)}>
              I have saved it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
