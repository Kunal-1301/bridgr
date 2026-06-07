import { type ReactNode } from 'react'
import { cn } from '../../../design-system/cn'

interface OnboardingFieldProps {
  label: string
  error?: string
  helper?: string
  children: ReactNode
}

export const OnboardingField = ({ label, error, helper, children }: OnboardingFieldProps) => (
  <div className="space-y-1.5">
    <p className="text-caption font-bold uppercase text-primary-800">{label}</p>
    {children}
    {(error || helper) && <p className={cn('text-caption', error ? 'text-error' : 'text-neutral-600')}>{error ?? helper}</p>}
  </div>
)
