import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PasswordInputProps = Omit<React.ComponentProps<'input'>, 'type'> & {
  showPassword?: boolean
  onTogglePassword?: (visible: boolean) => void
}

export function PasswordInput({
  className,
  showPassword,
  onTogglePassword,
  ...props
}: PasswordInputProps) {
  const [internalShow, setInternalShow] = useState(false)
  const isControlled = showPassword !== undefined
  const visible = isControlled ? showPassword : internalShow

  function handleToggle() {
    const next = !visible
    if (isControlled) {
      onTogglePassword?.(next)
    } else {
      setInternalShow(next)
    }
  }

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        className={cn('pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={handleToggle}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[var(--pencil)] hover:text-[var(--forest)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--forest)] rounded-sm"
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
    </div>
  )
}
