import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { BrandLogo, Button, Input } from '../../design-system/components'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export const AdminLoginPage = () => {
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { register, handleSubmit, formState } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const submit = async (values: FormValues) => {
    setFormError('')
    try {
      const response = await login({ ...values, role: 'admin' })
      setAuth({ ...response.user, role: 'admin' }, response.accessToken)
      navigate('/admin/dashboard')
    } catch {
      setFormError('Invalid email or password')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-800 px-6 py-12">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white p-7 shadow-panel">
        <div className="mb-7 flex justify-center">
          <BrandLogo />
        </div>
        <form onSubmit={handleSubmit(submit)} className="space-y-5">
          <Input label="Email" type="email" autoComplete="email" error={formState.errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register('password')} />
          {formError && <p className="rounded-sm border border-error/20 bg-error-tint px-3 py-2 text-caption font-semibold text-error">{formError}</p>}
          <Button type="submit" className="w-full" loading={formState.isSubmitting}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
