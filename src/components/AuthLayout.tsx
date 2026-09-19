import { Outlet, Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="relative min-h-svh flex flex-col">
      <div className="aurora-bg" aria-hidden />
      <header className="flex items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2 text-[#ccd6f6] hover:text-[#64ffda] transition-colors">
          <Shield className="size-5 text-[#64ffda]" />
          <span className="font-semibold tracking-tight">
            Auth<span className="gradient-text">SSO</span>
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <Outlet />
      </main>
    </div>
  )
}
