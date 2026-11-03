import { AlertTriangle, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/components/admin/types'

/** A one-time secret/link with a copy button and a warning. */
export function SecretValue({
  label,
  value,
  warning,
}: {
  label: string
  value: string
  warning: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2.5 rounded-xl border border-[var(--amber-border)] bg-[var(--amber-card)] p-3 text-xs sm:text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--amber-text)]" />
        <p className="text-[var(--amber-text)] leading-relaxed">{warning}</p>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--pencil)]">{label}</p>
        <div className="flex gap-2">
          <code className="min-w-0 flex-1 break-all rounded-xl border border-[var(--paper-border)] bg-[var(--paper)] px-3 py-2 font-mono text-xs text-[var(--ink)] select-all shadow-xs">
            {value}
          </code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => copyToClipboard(value, `${label} copied`)}
          >
            <Copy className="size-3.5" />
            Copy
          </Button>
        </div>
      </div>
    </div>
  )
}
