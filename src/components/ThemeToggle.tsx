import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative inline-flex items-center gap-1.5 rounded-full border border-[var(--paper-border-strong)] bg-[var(--paper)] px-3 py-1.5 text-xs font-medium text-[var(--pencil)] shadow-xs transition-all hover:border-[var(--forest)] hover:text-[var(--ink)] active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--forest)] focus-visible:outline-offset-2 ${className}`}
      aria-label={isDark ? 'Switch to warm day desk' : 'Switch to cozy night desk'}
      title={isDark ? 'Switch to warm day desk' : 'Switch to cozy night desk'}
    >
      {isDark ? (
        <>
          <Sun className="size-3.5 text-amber-400 transition-transform group-hover:rotate-45" />
          <span className="hidden sm:inline">Night desk</span>
        </>
      ) : (
        <>
          <Moon className="size-3.5 text-emerald-800 transition-transform group-hover:-rotate-12" />
          <span className="hidden sm:inline">Day desk</span>
        </>
      )}
    </button>
  )
}
