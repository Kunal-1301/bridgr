import React from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export type BadgeVariant =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'active'
  | 'completed'
  | 'suspended'
  | 'info'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant
  children: React.ReactNode
}

export const Badge = ({ variant, children, className, ...props }: BadgeProps) => {
  const variantStyles: Record<BadgeVariant, string> = {
    pending: 'bg-amber-tint text-amber border-amber/20',
    approved: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-error-tint text-error border-error/20',
    flagged: 'bg-warning-tint text-warning border-warning/20',
    active: 'bg-success/10 text-success border-success/20',
    completed: 'bg-blue-tint text-blue border-blue/20',
    suspended: 'bg-slate-100 text-muted border-slate-200',
    info: 'bg-info-tint text-info border-info/20',
  }

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors duration-150',
          variantStyles[variant],
          className
        )
      )}
      {...props}
    >
      {children}
    </span>
  )
}
