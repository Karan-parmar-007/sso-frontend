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
  'placeholder:text-[#8892b0] selection:bg-[#64ffda]/30 min-h-20 w-full rounded-md border border-[rgba(100,255,218,0.15)] bg-[#0a192f]/60 px-3 py-2 font-mono text-xs text-[#ccd6f6] outline-none focus-visible:border-[#64ffda] focus-visible:ring-[3px] focus-visible:ring-[#64ffda]/20'

export const selectClass =
  'h-8 rounded-md border border-[rgba(100,255,218,0.2)] bg-[#0a192f] px-2 text-[#64ffda] outline-none focus:ring-2 focus:ring-[#64ffda]/30'
