import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await signup(name, email, password)
      navigate('/login' + location.search, {
        replace: true,
        state: {
          email,
          verificationSent: true,
        },
      })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Signup failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className="w-full max-w-md"
    >
      <Card className="glass-hover">
        <CardHeader>
          <CardTitle className="text-2xl">
            Create <span className="gradient-text">account</span>
          </CardTitle>
          <CardDescription>
            One signup unlocks all projects on this domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="text-xs text-[#8892b0]">
                At least 8 characters with a letter and a number
              </p>
            </div>
            <Button type="submit" variant="default" className="w-full" disabled={loading}>
              {loading ? 'Creating…' : 'Sign up'}
            </Button>
            <p className="text-center text-sm text-[#8892b0]">
              Already have an account?{' '}
              <Link to={`/login${location.search}`} className="text-[#64ffda] hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
