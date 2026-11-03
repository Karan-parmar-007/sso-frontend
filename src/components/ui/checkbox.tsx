import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-4.5 shrink-0 rounded-[5px] border border-[var(--paper-border-strong)] bg-[var(--paper)] transition-all outline-none',
        'data-[state=checked]:bg-[var(--forest)] data-[state=checked]:text-[#ffffff] data-[state=checked]:border-[var(--forest)]',
        'focus-visible:ring-3 focus-visible:ring-[var(--forest-tint)] focus-visible:border-[var(--forest)]',
        'disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current"
      >
        <CheckIcon className="size-3.5 stroke-[2.5]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
