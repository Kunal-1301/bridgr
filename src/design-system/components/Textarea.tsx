import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../cn'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, id, className, ...props }, ref) => {
    const textareaId = id ?? props.name

    return (
      <label className="block space-y-1.5" htmlFor={textareaId}>
        {label && <span className="block text-caption font-bold uppercase text-primary-800">{label}</span>}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'min-h-28 w-full rounded-sm border bg-white px-3 py-2.5 text-body text-neutral-900 shadow-sm transition',
            'placeholder:text-neutral-600/70 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20',
            'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-600',
            error ? 'border-error focus:border-error focus:ring-error/20' : 'border-neutral-200',
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {(error || helperText) && (
          <span className={cn('block text-caption', error ? 'text-error' : 'text-neutral-600')}>
            {error ?? helperText}
          </span>
        )}
      </label>
    )
  }
)

Textarea.displayName = 'Textarea'
