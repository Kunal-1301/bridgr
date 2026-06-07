import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, icon, id, className, ...props }, ref) => {
    const inputId = id ?? props.name

    return (
      <label className="block space-y-1.5" htmlFor={inputId}>
        {label && <span className="block text-caption font-bold uppercase text-primary-800">{label}</span>}
        <span className="relative block">
          {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-[42px] w-full rounded-sm border bg-white px-3 text-body text-neutral-900 shadow-sm transition',
              'placeholder:text-neutral-600/70 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-600',
              icon && 'pl-10',
              error ? 'border-error focus:border-error focus:ring-error/20' : 'border-neutral-200',
              className
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
        </span>
        {(error || helperText) && (
          <span className={cn('block text-caption', error ? 'text-error' : 'text-neutral-600')}>
            {error ?? helperText}
          </span>
        )}
      </label>
    )
  }
)

Input.displayName = 'Input'
