import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthLayout } from '@/components/AuthLayout'
import {
  OwnerRoute,
  PrivateRoute,
  PublicOnlyRoute,
} from '@/components/ProtectedRoute'
import { UnverifiedEmailModal } from '@/components/auth/UnverifiedEmailModal'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'
import ConfirmEmailPage from '@/pages/ConfirmEmailPage'
import AccountPage from '@/pages/AccountPage'
import AdminPage from '@/pages/AdminPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <UnverifiedEmailModal />
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: '#112240',
              border: '1px solid rgba(100,255,218,0.15)',
              color: '#ccd6f6',
            },
          }}
        />
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          </Route>

          <Route element={<PrivateRoute />}>
            <Route path="/account" element={<AccountPage />} />
          </Route>

          <Route element={<OwnerRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
