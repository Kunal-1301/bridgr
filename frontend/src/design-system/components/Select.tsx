import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helperText?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, error, id, className, children, ...props }, ref) => {
    const selectId = id ?? props.name

    return (
      <label className="block space-y-1.5" htmlFor={selectId}>
        {label && <span className="block text-caption font-bold uppercase text-primary-800">{label}</span>}
        <span className="relative block">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-[42px] w-full appearance-none rounded-sm border bg-white px-3 pr-10 text-body text-neutral-900 shadow-sm transition',
              'focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 disabled:cursor-not-allowed disabled:bg-neutral-50',
              error ? 'border-error focus:border-error focus:ring-error/20' : 'border-neutral-200',
              className
            )}
            aria-invalid={Boolean(error)}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
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

Select.displayName = 'Select'
