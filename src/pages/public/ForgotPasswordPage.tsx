import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { apiClient } from '../../api/client'
import { BrandLogo, Button, Input } from '../../design-system/components'

const emailSchema = z.object({ email: z.string().email('Enter a valid email') })
const resetSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit OTP'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords must match',
})

type EmailForm = z.infer<typeof emailSchema>
type ResetForm = z.infer<typeof resetSchema>

export const ForgotPasswordPage = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) })
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) })

  const requestOtp = async (values: EmailForm) => {
    setFormError('')
    try {
      await apiClient.post('/auth/forgot-password', values)
      setEmail(values.email)
      setStep(2)
    } catch {
      setFormError('We could not send an OTP for that email')
    }
  }

  const resetPassword = async (values: ResetForm) => {
    setFormError('')
    try {
      await apiClient.post('/auth/reset-password', { email, otp: values.otp, password: values.password })
      setStep(3)
    } catch {
      setFormError('Invalid OTP or expired reset request')
    }
  }

  if (step === 3) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
        <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-tint text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-page-title text-primary-800">Password reset</h1>
          <p className="mt-3 text-body text-neutral-600">Your password has been updated. You can return to login now.</p>
          <Link to="/login" className="mt-6 inline-flex h-[42px] items-center justify-center rounded-sm bg-primary-600 px-4 text-body font-semibold text-white shadow-sm">
            Return to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-7 shadow-md">
        <BrandLogo />
        <h1 className="mt-8 text-page-title text-primary-800">Reset password</h1>
        <p className="mt-2 text-body text-neutral-600">{step === 1 ? 'Enter your email and we will send a reset OTP.' : 'Enter the 6-digit OTP. It expires in 10 minutes.'}</p>

        {step === 1 ? (
          <form onSubmit={emailForm.handleSubmit(requestOtp)} className="mt-6 space-y-5">
            <Input label="Email" type="email" error={emailForm.formState.errors.email?.message} {...emailForm.register('email')} />
            {formError && <p className="rounded-sm border border-error/20 bg-error-tint px-3 py-2 text-caption font-semibold text-error">{formError}</p>}
            <Button type="submit" loading={emailForm.formState.isSubmitting} className="w-full">Send OTP</Button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(resetPassword)} className="mt-6 space-y-5">
            <Input label="OTP" inputMode="numeric" maxLength={6} error={resetForm.formState.errors.otp?.message} {...resetForm.register('otp')} />
            <Input label="New password" type="password" error={resetForm.formState.errors.password?.message} {...resetForm.register('password')} />
            <Input label="Confirm password" type="password" error={resetForm.formState.errors.confirmPassword?.message} {...resetForm.register('confirmPassword')} />
            {formError && <p className="rounded-sm border border-error/20 bg-error-tint px-3 py-2 text-caption font-semibold text-error">{formError}</p>}
            <Button type="submit" loading={resetForm.formState.isSubmitting} className="w-full">Reset password</Button>
          </form>
        )}
      </div>
    </div>
  )
}
