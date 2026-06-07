import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { apiClient } from '../../api/client'
import { BrandLogo, Button, Input, Select, Textarea } from '../../design-system/components'

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Phone is required'),
  companyWebsite: z.string().optional(),
  referralPlan: z.string().min(10, 'Tell us how you will refer workers'),
  monthlyReferrals: z.string().min(1, 'Choose an estimate'),
})

type AffiliateForm = z.infer<typeof schema>

export const AffiliateSignupPage = () => {
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AffiliateForm>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: AffiliateForm) => {
    setFormError('')
    try {
      await apiClient.post('/affiliates/apply', values)
      setSuccess(true)
    } catch {
      setFormError('We could not submit your application. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
        <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-md">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-tint text-success">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-page-title text-primary-800">Thanks!</h1>
          <p className="mt-3 text-body text-neutral-600">We&apos;ll review your application and be in touch within 48 hours.</p>
          <Link to="/" className="mt-6 inline-flex h-[42px] items-center justify-center rounded-sm bg-primary-600 px-4 text-body font-semibold text-white shadow-sm">
            Go to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <BrandLogo />
        <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-7 shadow-md">
          <h1 className="text-page-title text-primary-800">Affiliate Program</h1>
          <p className="mt-2 text-body text-neutral-600">Refer high-quality workers into Bridgr&apos;s talent pool.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-7 grid gap-5 md:grid-cols-2">
            <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
            <Input label="Company / website" error={errors.companyWebsite?.message} {...register('companyWebsite')} />
            <div className="md:col-span-2">
              <Textarea label="How will you refer workers?" error={errors.referralPlan?.message} {...register('referralPlan')} />
            </div>
            <div className="md:col-span-2">
              <Select label="Estimated monthly referrals" error={errors.monthlyReferrals?.message} {...register('monthlyReferrals')}>
                <option value="">Select range</option>
                <option>1-10</option>
                <option>11-25</option>
                <option>26-50</option>
                <option>50+</option>
              </Select>
            </div>
            <div className="md:col-span-2">
              {formError && <p className="rounded-sm border border-error/20 bg-error-tint px-3 py-2 text-caption font-semibold text-error">{formError}</p>}
              <Button type="submit" loading={isSubmitting} className="mt-2 w-full">Submit application</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
