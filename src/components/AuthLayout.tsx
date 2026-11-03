import { Outlet, Link, useLocation } from 'react-router-dom'
import { KeyMark } from '@/components/KeyMark'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'

export function AuthLayout() {
  const location = useLocation()
  const { user } = useAuth()
  const pathname = location.pathname

  return (
    <div className="min-h-svh flex flex-col justify-between transition-colors duration-200">
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5 font-hand text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight hover:opacity-85 transition-opacity"
        >
          <KeyMark className="size-5 sm:size-6 text-[var(--forest)] transition-transform group-hover:rotate-12" />
          <span>karan</span>
          <span className="hidden sm:inline-block font-sans text-[11px] uppercase tracking-wider font-semibold text-[var(--pencil-light)] ml-1 border-l border-[var(--paper-border)] pl-2">
            Single Sign-On
          </span>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <ThemeToggle />

          {user ? (
            <Link
              to="/account"
              className="text-xs sm:text-sm font-medium text-[var(--pencil)] hover:text-[var(--forest)] transition-colors underline-offset-4 hover:underline"
            >
              My Account
            </Link>
          ) : pathname === '/signup' ? (
            <Link
              to={`/login${location.search}`}
              className="text-xs sm:text-sm font-medium text-[var(--pencil)] hover:text-[var(--forest)] transition-colors underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          ) : pathname === '/login' ? (
            <Link
              to={`/signup${location.search}`}
              className="text-xs sm:text-sm font-medium text-[var(--pencil)] hover:text-[var(--forest)] transition-colors underline-offset-4 hover:underline"
            >
              Make account
            </Link>
          ) : (
            <Link
              to={`/login${location.search}`}
              className="text-xs sm:text-sm font-medium text-[var(--pencil)] hover:text-[var(--forest)] transition-colors underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-8 flex flex-col justify-center">
        <Outlet />
      </main>

      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-5 text-center text-xs text-[var(--pencil-light)] font-hand text-base sm:text-lg">
        same key for the portfolio, family os, and studio ·{' '}
        <a
          href="https://karanparmar.in"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--forest)] hover:underline"
        >
          karanparmar.in
        </a>
      </footer>
    </div>
  )
}
