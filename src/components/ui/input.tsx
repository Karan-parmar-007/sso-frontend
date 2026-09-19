import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-[#8892b0] selection:bg-[#64ffda]/30 selection:text-[#ccd6f6] h-10 w-full min-w-0 rounded-md border border-[rgba(100,255,218,0.15)] bg-[#0a192f]/60 px-3 py-2 text-sm text-[#ccd6f6] shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-[#64ffda] focus-visible:ring-[#64ffda]/20 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  )
}

export { Input }
