import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { login } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { BrandLogo, Button, Input } from '../../design-system/components'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type ClientLoginForm = z.infer<typeof schema>

export const ClientLoginPage = () => {
  const [formError, setFormError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClientLoginForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: ClientLoginForm) => {
    setFormError('')
    try {
      const response = await login({ ...values, role: 'client' })
      setAuth({ ...response.user, role: 'client' }, response.accessToken)
      navigate('/c/dashboard')
    } catch {
      setFormError('Invalid email or password')
    }
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[42%_58%]">
      <aside className="relative hidden overflow-hidden bg-primary-800 p-8 text-white lg:flex lg:flex-col lg:justify-between">
        <BrandLogo variant="white" />
        <div className="max-w-sm">
          <p className="text-caption font-bold uppercase text-accent-500">Client access</p>
          <h1 className="mt-3 text-display text-white">Submit work into a managed delivery layer.</h1>
          <p className="mt-4 text-body-lg text-white/75">Client accounts are invitation-only and operator managed.</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/10 p-5">
          <ShieldCheck className="h-7 w-7 text-primary-400" />
          <p className="mt-3 text-body font-semibold">Workers remain private throughout delivery.</p>
        </div>
      </aside>
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <BrandLogo className="lg:hidden" />
          <span className="mt-8 inline-flex rounded-full bg-accent-50 px-3 py-1 text-caption font-bold uppercase text-primary-800 lg:mt-0">Invite only</span>
          <h2 className="mt-4 text-page-title text-primary-800">Client sign in</h2>
          <p className="mt-2 text-body text-neutral-600">Use the credentials provided by your Bridgr operator.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
            {formError && <p className="rounded-sm border border-error/20 bg-error-tint px-3 py-2 text-caption font-semibold text-error">{formError}</p>}
            <Button type="submit" className="w-full" loading={isSubmitting} iconRight={<ArrowRight className="h-4 w-4" />}>
              Log in
            </Button>
          </form>
          <p className="mt-6 text-center text-body">
            <Link to="/" className="font-bold text-primary-600 hover:underline">Back to home</Link>
          </p>
        </div>
      </main>
    </div>
  )
}
