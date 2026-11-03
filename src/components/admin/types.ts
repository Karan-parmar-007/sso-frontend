import { toast } from 'sonner'

export type AdminUser = {
  id: string
  name: string
  email: string
  email_verified: boolean
  role_name?: string | null
  app_roles?: Record<string, string[]>
  created_at?: string | null
}

export type AdminUsersResponse = {
  total_count: number
  page: number
  page_size: number
  total_pages: number
  users: AdminUser[]
}

export type AdminRole = {
  id: string
  name: string
  created_at?: string | null
  updated_at?: string | null
}

export type AdminClient = {
  client_id: string
  name: string
  first_party: boolean
  roles: string[]
  redirect_uris: string[]
  post_logout_redirect_uris: string[]
  allowed_scopes: string[]
  confidential: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type AdminClientWithSecret = AdminClient & { client_secret?: string | null }

export const SUPPORTED_SCOPES = ['openid', 'profile', 'email', 'offline_access'] as const

export const ADMIN_KEYS = {
  users: (page: number) => ['admin', 'users', page] as const,
  allUsers: ['admin', 'users'] as const,
  roles: ['admin', 'roles'] as const,
  clients: ['admin', 'clients'] as const,
  audit: ['admin', 'audit'] as const,
}

/** Split a textarea/comma list into trimmed, de-duplicated, non-empty items. */
export function parseList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  )
}

export async function copyToClipboard(text: string, what = 'Copied') {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(what)
  } catch {
    toast.error('Copy failed — select the text and copy it manually')
  }
}

export const textareaClass =
  'placeholder:text-[var(--pencil-light)] selection:bg-[var(--forest-tint)] min-h-20 w-full rounded-xl border border-[var(--paper-border)] bg-[var(--paper)] px-3.5 py-2.5 font-mono text-xs text-[var(--ink)] outline-none focus-visible:border-[var(--forest)] focus-visible:ring-3 focus-visible:ring-[var(--forest-tint)] transition-all'

export const selectClass =
  'h-9 rounded-lg border border-[var(--paper-border-strong)] bg-[var(--paper)] px-2.5 text-xs font-semibold text-[var(--forest)] outline-none focus:ring-2 focus:ring-[var(--forest-tint)] cursor-pointer'
