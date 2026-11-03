import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all transform-gpu active:scale-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-[var(--forest)] focus-visible:outline-offset-2 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--forest)] text-[#ffffff] hover:bg-[var(--forest-hover)] font-semibold shadow-xs',
        destructive:
          'bg-[var(--terracotta)] text-white hover:opacity-90 font-medium shadow-xs',
        outline:
          'border border-[var(--paper-border-strong)] text-[var(--ink)] bg-[var(--paper)] hover:border-[var(--forest)] hover:bg-[var(--forest-tint)] shadow-xs',
        secondary:
          'bg-[var(--forest-tint)] text-[var(--ink)] hover:bg-[var(--forest-tint)]/80 font-medium',
        ghost:
          'text-[var(--pencil)] hover:text-[var(--ink)] hover:bg-[var(--forest-tint)]',
        link:
          'text-[var(--forest)] underline-offset-4 hover:underline font-semibold p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 px-3 text-xs gap-1.5 has-[>svg]:px-2.5',
        lg: 'h-11 px-6 text-base has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'outline',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
