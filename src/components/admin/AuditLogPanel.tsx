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
import { getErrorMessage } from '@/lib/errors'
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

  // Parent changed the filter (e.g. "Activity" on a user row).
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
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ScrollText className="size-5 text-[#64ffda]" />
              Audit log
            </CardTitle>
            <CardDescription>
              Security events across all accounts.{' '}
              {data && (
                <>
                  Matching: <span className="text-[#64ffda]">{data.total_count}</span>
                </>
              )}
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => audit.refetch()} disabled={audit.isFetching}>
            <RefreshCw className={`size-4 ${audit.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="audit-event">Event</Label>
              <select
                id="audit-event"
                className={cn(selectClass, 'h-10 w-full sm:w-72')}
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
              <div className="flex-1 space-y-2">
                <Label htmlFor="audit-user">User ID</Label>
                <Input
                  id="audit-user"
                  placeholder="Filter by user id"
                  className="font-mono text-xs"
                  value={userIdDraft}
                  onChange={(e) => setUserIdDraft(e.target.value)}
                />
              </div>
              <Button type="submit" size="sm" className="h-10">
                Apply
              </Button>
              {appliedUserId && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-10"
                  onClick={() => onUserIdChange('')}
                >
                  <X className="size-4" />
                  Clear
                </Button>
              )}
            </form>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[rgba(100,255,218,0.1)]">
            <table className="w-full text-sm">
              <thead className="bg-[#0a192f]/60 text-[#8892b0]">
                <tr>
                  <th className="text-left p-3 font-medium">When</th>
                  <th className="text-left p-3 font-medium">Event</th>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">IP / device</th>
                  <th className="text-left p-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {data?.events.map((e) => {
                  const tone = eventTone(e.event)
                  return (
                    <tr
                      key={e.id}
                      className="border-t border-[rgba(100,255,218,0.08)] align-top hover:bg-[#112240]/80"
                    >
                      <td className="p-3 whitespace-nowrap text-xs text-[#8892b0]">
                        {formatWhen(e.created_at)}
                      </td>
                      <td className="p-3">
                        <p
                          className={cn(
                            tone === 'danger'
                              ? 'text-red-300'
                              : tone === 'warning'
                                ? 'text-amber-300'
                                : 'text-[#ccd6f6]'
                          )}
                        >
                          {eventLabel(e.event)}
                        </p>
                        <p className="font-mono text-[11px] text-[#8892b0]">{e.event}</p>
                      </td>
                      <td className="p-3 text-xs">
                        {e.email && <p className="text-[#ccd6f6]">{e.email}</p>}
                        {e.user_id && (
                          <button
                            type="button"
                            className="font-mono text-[11px] text-[#64ffda] hover:underline"
                            title="Show only this user"
                            onClick={() => onUserIdChange(e.user_id!)}
                          >
                            {e.user_id}
                          </button>
                        )}
                        {e.actor_id && e.actor_id !== e.user_id && (
                          <p className="text-[11px] text-[#8892b0]">
                            by <span className="font-mono">{e.actor_id}</span>
                          </p>
                        )}
                        {!e.email && !e.user_id && <span className="text-[#8892b0]">—</span>}
                      </td>
                      <td className="p-3 text-xs text-[#8892b0]">
                        <p>{e.ip || '—'}</p>
                        {e.user_agent && (
                          <p className="max-w-56 truncate" title={e.user_agent}>
                            {shortUserAgent(e.user_agent, 48)}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-xs text-[#8892b0] break-words">
                        {eventDetails(e) || '—'}
                      </td>
                    </tr>
                  )
                })}
                {data && data.events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[#8892b0]">
                      No matching events
                    </td>
                  </tr>
                )}
                {audit.isError && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-amber-300">
                      {getErrorMessage(audit.error, 'Failed to load audit log')}
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
                disabled={page <= 1 || audit.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Prev
              </Button>
              <Button
                size="sm"
                disabled={page >= totalPages || audit.isFetching}
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
  )
}
