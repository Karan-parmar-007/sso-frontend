import { useState } from 'react'
import { toast } from 'sonner'
import { MailCheck } from 'lucide-react'
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
          <div className="flex items-center gap-2 justify-center sm:justify-start text-[var(--forest)] mb-1">
            <MailCheck className="size-5" />
            <span className="font-hand text-lg font-semibold">safety note</span>
          </div>
          <DialogTitle>Verify your email</DialogTitle>
          <DialogDescription>
            Your account is working, but{' '}
            <strong className="text-[var(--ink)] font-semibold">{user.email}</strong> is not verified yet.
            Please check your inbox to confirm your address.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowVerifyModal(false)}>
            Later
          </Button>
          <Button variant="default" onClick={handleResend} disabled={sending}>
            {sending ? 'Sending link…' : 'Resend verification link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
