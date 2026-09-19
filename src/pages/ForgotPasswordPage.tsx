import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import apiClient from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await apiClient.post('/forgot-password', { email })
      setSent(true)
      toast.success('If that email exists, a reset link was sent')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Forgot <span className="gradient-text">password</span>
          </CardTitle>
          <CardDescription>
            We will email you a secure reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-sm text-[#8892b0]">
              <p>
                Check your inbox for a reset link. It expires soon and can only
                be used once.
              </p>
              <Button asChild className="w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" variant="default" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
              </Button>
              <Link to="/login" className="text-center text-sm text-[#64ffda] hover:underline">
                Back to sign in
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
