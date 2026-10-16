/** Security audit events (backend AuditService) → human-readable labels. */

export type AuditEvent = {
  id: string
  event: string
  created_at: string
  user_id?: string | null
  email?: string | null
  actor_id?: string | null
  session_id?: string | null
  ip?: string | null
  user_agent?: string | null
  meta?: Record<string, unknown> | null
}

export type AuditEventsResponse = {
  total_count: number
  page: number
  page_size: number
  events: AuditEvent[]
}

export type EventTone = 'normal' | 'warning' | 'danger'

const EVENT_LABELS: Record<string, string> = {
  signup: 'Account created',
  'signup.existing_email': 'Signup attempted with an existing email',
  'login.success': 'Signed in',
  'login.failure': 'Failed sign-in attempt',
  'login.new_device': 'Signed in from a new device',
  'login.unverified': 'Sign-in blocked: email not verified',
  logout: 'Signed out',
  'session.revoked': 'Session ended',
  'session.revoked_others': 'Other sessions signed out',
  'session.refresh_reuse': 'Suspicious token reuse — session ended',
  'password.changed': 'Password changed',
  'password.check_failed': 'Wrong current password entered',
  'password.reset': 'Password reset',
  'password.reset_requested': 'Password reset requested',
  'email.verified': 'Email verified',
  'email.change_requested': 'Email change requested',
  'email.changed': 'Email changed',
  'admin.password_reset': 'Password reset by an administrator',
  'admin.role_changed': 'Role changed by an administrator',
  'admin.role_created': 'Role created',
  'admin.user_updated': 'Account updated by an administrator',
  'admin.app_roles_changed': 'Application roles changed',
  'admin.client_created': 'Application created',
  'admin.client_updated': 'Application updated',
  'admin.client_secret_rotated': 'Application secret rotated',
  'admin.client_deleted': 'Application deleted',
}

const DANGER = new Set(['session.refresh_reuse'])
const WARNING = new Set([
  'login.failure',
  'login.new_device',
  'login.unverified',
  'password.check_failed',
  'signup.existing_email',
  'admin.password_reset',
])

/** Every known event name (for filters). */
export const KNOWN_EVENTS = Object.keys(EVENT_LABELS).sort()

export function eventLabel(event: string): string {
  return EVENT_LABELS[event] ?? event
}

export function eventTone(event: string): EventTone {
  if (DANGER.has(event)) return 'danger'
  if (WARNING.has(event)) return 'warning'
  return 'normal'
}

/** Extra context for a row, e.g. "everywhere" or the client id. */
export function eventDetails(e: AuditEvent): string | null {
  const meta = e.meta
  if (!meta) return null
  const parts: string[] = []
  for (const [key, value] of Object.entries(meta)) {
    if (value === null || value === undefined || value === false) continue
    if (value === true) {
      parts.push(key.replace(/_/g, ' '))
    } else if (Array.isArray(value)) {
      parts.push(`${key.replace(/_/g, ' ')}: ${value.join(', ') || '—'}`)
    } else if (typeof value === 'object') {
      parts.push(`${key.replace(/_/g, ' ')}: ${JSON.stringify(value)}`)
    } else {
      parts.push(`${key.replace(/_/g, ' ')}: ${String(value)}`)
    }
  }
  return parts.length ? parts.join(' · ') : null
}

export function formatWhen(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function shortUserAgent(ua?: string | null, max = 72) {
  if (!ua) return 'Unknown device'
  const text = ua.trim()
  return text.length <= max ? text : `${text.slice(0, max)}…`
}
