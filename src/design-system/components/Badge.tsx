import { type HTMLAttributes } from 'react'
import { cn } from '../cn'

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'amber' | 'blue'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  neutral: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  success: 'border-success/20 bg-success-tint text-success',
  warning: 'border-warning/20 bg-warning-tint text-warning',
  error: 'border-error/20 bg-error-tint text-error',
  info: 'border-info/20 bg-info-tint text-info',
  amber: 'border-accent-500/25 bg-accent-50 text-primary-800',
  blue: 'border-primary-600/20 bg-primary-50 text-primary-600',
}

export const Badge = ({ variant = 'neutral', className, ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-semibold leading-5',
      variants[variant],
      className
    )}
    {...props}
  />
)
