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
      <div className="flex gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
        <p className="text-amber-200">{warning}</p>
      </div>
      <div className="space-y-2">
        <p className="text-sm text-[#8892b0]">{label}</p>
        <div className="flex gap-2">
          <code className="min-w-0 flex-1 break-all rounded-md border border-[rgba(100,255,218,0.15)] bg-[#0a192f]/60 px-3 py-2 font-mono text-xs text-[#ccd6f6] select-all">
            {value}
          </code>
          <Button
            type="button"
            size="sm"
            variant="secondary"
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
