import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { apiClient } from '../../api/client'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export const EmailVerifyPage = () => {
  const { token } = useParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const verify = async () => {
      try {
        await apiClient.post(`/auth/verify-email/${token}`)
        setStatus('success')
      } catch {
        setStatus('error')
      }
    }
    verify()
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-white p-8 text-center shadow-md">
        {status === 'loading' ? (
          <>
            <LoadingSpinner />
            <p className="mt-5 text-sm font-semibold text-muted">Verifying your email...</p>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
            <h1 className="mt-5 text-2xl font-bold text-navy">Email verified!</h1>
            <p className="mt-2 text-sm text-muted">You can now log in.</p>
            <Link to="/login" className="mt-6 inline-flex rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white">Go to Login</Link>
          </>
        ) : (
          <>
            <AlertCircle className="mx-auto h-14 w-14 text-error" />
            <h1 className="mt-5 text-2xl font-bold text-navy">Link expired or invalid</h1>
            <p className="mt-2 text-sm text-muted">Request a new verification link or contact support.</p>
          </>
        )}
      </div>
    </div>
  )
}
