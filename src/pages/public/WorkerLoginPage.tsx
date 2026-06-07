import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight } from 'lucide-react'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { BrandLogo, Button, Input, MobileShell } from '../../design-system/components'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export const WorkerLoginPage = () => {
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginForm) => {
    setFormError('')
    try {
      const response = await login({ ...values, role: 'worker' })
      setAuth({ ...response.user, role: 'worker' }, response.accessToken)
      navigate('/w/dashboard')
    } catch {
      setFormError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-primary-800 px-4 py-6 sm:py-10">
      <MobileShell framed className="min-h-[760px] bg-white" contentClassName="bg-white">
        <div className="flex min-h-[690px] flex-col px-1">
          <div className="flex items-center justify-between px-1 text-caption font-semibold text-neutral-600">
            <span>9:41</span>
            <span>Worker</span>
          </div>

          <div className="mt-14 flex justify-center">
            <BrandLogo size="lg" />
          </div>

          <div className="mt-12">
            <h1 className="text-center text-page-title text-primary-800">Welcome back</h1>
            <p className="mt-2 text-center text-body text-neutral-600">Log in to your worker account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <div>
              <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
              <Link to="/forgot-password" className="mt-2 inline-block text-caption font-bold text-primary-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            {formError && (
              <p className="rounded-sm border border-error/20 bg-error-tint px-3 py-2 text-caption font-semibold text-error">
                {formError}
              </p>
            )}
            <Button type="submit" className="w-full" loading={isSubmitting} iconRight={<ArrowRight className="h-4 w-4" />}>
              Log in
            </Button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-neutral-200" />
            <span className="text-caption font-semibold text-neutral-600">or</span>
            <span className="h-px flex-1 bg-neutral-200" />
          </div>

          <p className="text-center text-body text-neutral-600">
            New to Bridgr?{' '}
            <Link to="/register" className="font-bold text-primary-600 hover:underline">
              Apply as a worker
            </Link>
          </p>

          <p className="mt-auto px-4 pb-2 text-center text-caption text-neutral-600">
            Client/admin sign-in is separate and invite-only.
          </p>
        </div>
      </MobileShell>
    </div>
  )
}
