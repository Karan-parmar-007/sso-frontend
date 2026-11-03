import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DoodleBook, DoodleHouse, DoodleWave, KeyMark } from '@/components/KeyMark'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const { user, loading } = useAuth()

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center"
      >
        <div className="size-16 sm:size-20 rounded-2xl border-2 border-[var(--paper-border-strong)] bg-[var(--paper)] flex items-center justify-center text-[var(--forest)] shadow-md mb-6 transform -rotate-2">
          <KeyMark className="size-8 sm:size-10" />
        </div>

        <p className="font-hand text-2xl sm:text-3xl font-semibold text-[var(--forest)] leading-none mb-2">
          single sign-on service
        </p>

        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] max-w-xl leading-[1.1]">
          One account for every app on karanparmar.in
        </h1>

        <p className="text-sm sm:text-base text-[var(--pencil)] mt-4 max-w-lg leading-relaxed">
          Sign in once at the desk, and the portfolio, Family OS, and Studio all recognise your session immediately.
        </p>

        {/* Place sketch cards showcase */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl my-8 text-left">
          <a
            href="https://karanparmar.in"
            target="_blank"
            rel="noreferrer"
            className="sketch-card p-4 group hover:-translate-y-1 transition-all"
          >
            <span className="desk-sheet-tape-center" aria-hidden />
            <div className="text-[var(--line)] mb-2 flex justify-center">
              <DoodleHouse className="w-14 h-12" />
            </div>
            <strong className="block font-hand text-lg font-bold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors">
              Portfolio
            </strong>
            <span className="block text-xs text-[var(--pencil-light)] mt-0.5">
              karanparmar.in
            </span>
          </a>

          <a
            href="https://familyos.karanparmar.in"
            target="_blank"
            rel="noreferrer"
            className="sketch-card p-4 group sm:translate-y-2 hover:-translate-y-0 transition-all"
          >
            <span className="desk-sheet-tape-center" aria-hidden />
            <div className="text-[var(--line)] mb-2 flex justify-center">
              <DoodleBook className="w-14 h-12" />
            </div>
            <strong className="block font-hand text-lg font-bold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors">
              Family OS
            </strong>
            <span className="block text-xs text-[var(--pencil-light)] mt-0.5">
              familyos.karanparmar.in
            </span>
          </a>

          <a
            href="https://studio.karanparmar.in"
            target="_blank"
            rel="noreferrer"
            className="sketch-card p-4 group hover:-translate-y-1 transition-all"
          >
            <span className="desk-sheet-tape-center" aria-hidden />
            <div className="text-[var(--line)] mb-2 flex justify-center">
              <DoodleWave className="w-14 h-12" />
            </div>
            <strong className="block font-hand text-lg font-bold text-[var(--ink)] group-hover:text-[var(--forest)] transition-colors">
              Studio
            </strong>
            <span className="block text-xs text-[var(--pencil-light)] mt-0.5">
              studio.karanparmar.in
            </span>
          </a>
        </div>

        {/* Action button */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {loading ? (
            <div className="h-12 rounded-full bg-[var(--forest-tint)] animate-pulse" />
          ) : user ? (
            <Button asChild variant="default" size="lg" className="w-full">
              <Link to="/account">
                <UserCheck className="size-4" />
                Continue as {user.name}
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="default" size="lg" className="flex-1">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1">
                <Link to="/signup">Create account</Link>
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
