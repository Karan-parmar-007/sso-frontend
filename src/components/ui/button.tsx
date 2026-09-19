import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all transform-gpu active:scale-95 active:opacity-90 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  {
    variants: {
      variant: {
        default:
          'bg-[#64ffda] text-[#0a192f] hover:bg-[#64ffda]/90 font-semibold',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20',
        outline:
          'border border-[#64ffda] text-[#64ffda] bg-transparent hover:bg-[#64ffda]/10 hover:text-[#64ffda] shadow-none',
        secondary:
          'bg-[#172a45] text-[#ccd6f6] hover:bg-[#233554]',
        ghost: 'hover:bg-[#172a45] hover:text-[#ccd6f6]',
        link: 'text-[#64ffda] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-11 rounded-md px-6 has-[>svg]:px-4',
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

export { Button, buttonVariants }
