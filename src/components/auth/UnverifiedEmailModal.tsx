import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/errors'

export function UnverifiedEmailModal() {
  const { user, showVerifyModal, setShowVerifyModal, resendVerification } =
    useAuth()
  const [sending, setSending] = useState(false)

  if (!user || user.email_verified) return null

  async function handleResend() {
    setSending(true)
    try {
      await resendVerification()
      toast.success('Verification email sent')
      setShowVerifyModal(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not resend verification email'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={showVerifyModal} onOpenChange={setShowVerifyModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify your email</DialogTitle>
          <DialogDescription>
            Your account works, but <strong className="text-[#ccd6f6]">{user.email}</strong> is
            not verified yet. Check your inbox or resend the link.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowVerifyModal(false)}>
            Later
          </Button>
          <Button variant="default" onClick={handleResend} disabled={sending}>
            {sending ? 'Sending…' : 'Resend link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
