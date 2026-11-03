import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-xl border border-[var(--paper-border)] bg-[var(--paper)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--pencil-light)] shadow-xs transition-all outline-none',
        'focus-visible:border-[var(--forest)] focus-visible:ring-3 focus-visible:ring-[var(--forest-tint)]',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-[var(--terracotta)] aria-invalid:ring-3 aria-invalid:ring-[var(--terracotta-tint)]',
        className
      )}
      {...props}
    />
  )
}

export { Input }
