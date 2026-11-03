import { useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, RefreshCw, ScrollText, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuditLog } from '@/components/admin/queries'
import { selectClass } from '@/components/admin/types'
import {
  KNOWN_EVENTS,
  eventDetails,
  eventLabel,
  eventTone,
  formatWhen,
  shortUserAgent,
} from '@/lib/auditEvents'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 50

export function AuditLogPanel({
  userId,
  onUserIdChange,
}: {
  userId: string
  onUserIdChange: (userId: string) => void
}) {
  const [page, setPage] = useState(1)
  const [event, setEvent] = useState('')
  const [userIdDraft, setUserIdDraft] = useState(userId)
  const [appliedUserId, setAppliedUserId] = useState(userId)

  if (userId !== appliedUserId) {
    setAppliedUserId(userId)
    setUserIdDraft(userId)
    setPage(1)
  }

  const audit = useAuditLog({ page, pageSize: PAGE_SIZE, event, userId: appliedUserId })
  const data = audit.data
  const totalPages = Math.max(1, Math.ceil((data?.total_count ?? 0) / PAGE_SIZE))

  function applyUserId(e: React.FormEvent) {
    e.preventDefault()
    onUserIdChange(userIdDraft.trim())
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <span className="desk-sheet-tape" aria-hidden />
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div>
            <p className="font-hand text-xl font-semibold text-[var(--forest)] leading-none">
              system ledger
            </p>
            <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
              <ScrollText className="size-5 text-[var(--forest)]" />
              Audit log
            </CardTitle>
            <CardDescription>
              Security events across all accounts.{' '}
              {data && (
                <>
                  Matching: <strong className="text-[var(--forest)]">{data.total_count}</strong>
                </>
              )}
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => audit.refetch()} disabled={audit.isFetching}>
            <RefreshCw className={`size-3.5 ${audit.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="audit-event">Filter by event</Label>
              <select
                id="audit-event"
                className={cn(selectClass, 'h-11 w-full sm:w-72')}
                value={event}
                onChange={(e) => {
                  setEvent(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">All events</option>
                {KNOWN_EVENTS.map((name) => (
                  <option key={name} value={name}>
                    {eventLabel(name)} ({name})
                  </option>
                ))}
              </select>
            </div>
            <form onSubmit={applyUserId} className="flex flex-1 items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="audit-user">Filter by user ID</Label>
                <Input
                  id="audit-user"
                  placeholder="Filter by user id"
                  className="font-mono text-xs"
                  value={userIdDraft}
                  onChange={(e) => setUserIdDraft(e.target.value)}
                />
              </div>
              <Button type="submit" size="default" variant="default" className="h-11 px-5">
                Apply
              </Button>
              {appliedUserId && (
                <Button
                  type="button"
                  size="default"
                  variant="ghost"
                  className="h-11"
                  onClick={() => onUserIdChange('')}
                >
                  <X className="size-4" />
                  Clear
                </Button>
              )}
            </form>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[var(--paper-border)] bg-[var(--paper)]">
            <table className="w-full text-xs sm:text-sm">
              <thead className="border-b border-[var(--paper-border)] bg-[var(--forest-tint-subtle)] text-[var(--pencil)]">
                <tr>
                  <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">When</th>
                  <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">Event</th>
                  <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">User</th>
                  <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">IP / Device</th>
                  <th className="text-left p-3 font-semibold uppercase tracking-wider text-[11px]">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--paper-border)]">
                {data?.events.map((e) => {
                  const tone = eventTone(e.event)
                  return (
                    <tr
                      key={e.id}
                      className="align-top hover:bg-[var(--forest-tint-subtle)] transition-colors"
                    >
                      <td className="p-3 whitespace-nowrap text-xs text-[var(--pencil-light)]">
                        {formatWhen(e.created_at)}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={cn(
                            'font-semibold text-xs',
                            tone === 'danger'
                              ? 'text-[var(--terracotta)]'
                              : tone === 'warning'
                                ? 'text-[var(--amber-text)]'
                                : 'text-[var(--ink)]'
                          )}
                        >
                          {eventLabel(e.event)}
                        </span>
                        <p className="font-mono text-[10px] text-[var(--pencil-light)]">{e.event}</p>
                      </td>
                      <td className="p-3">
                        {e.email && <p className="font-medium text-[var(--ink)]">{e.email}</p>}
                        {e.user_id && (
                          <button
                            type="button"
                            onClick={() => onUserIdChange(e.user_id!)}
                            className="font-mono text-[11px] text-[var(--forest)] hover:underline cursor-pointer"
                            title="Filter by this user id"
                          >
                            {e.user_id}
                          </button>
                        )}
                        {!e.email && !e.user_id && <span className="text-[var(--pencil-light)]">—</span>}
                      </td>
                      <td className="p-3 text-xs text-[var(--pencil)]">
                        {e.ip && <p className="font-mono">{e.ip}</p>}
                        {e.user_agent && (
                          <p className="truncate max-w-[200px] text-[var(--pencil-light)]" title={e.user_agent}>
                            {shortUserAgent(e.user_agent, 40)}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-xs text-[var(--pencil)] break-words">
                        {eventDetails(e) || '—'}
                      </td>
                    </tr>
                  )
                })}
                {data && data.events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-xs text-[var(--pencil)]">
                      No security events matched the active filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {data && totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-[var(--pencil)]">
                Page {data.page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || audit.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-3.5" />
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || audit.isFetching}
                  onClick={() => setPage((p) => p + 1)}
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
  )
}
