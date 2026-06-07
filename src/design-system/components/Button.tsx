import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-800 focus-visible:ring-primary-600',
  secondary: 'border border-neutral-200 bg-white text-primary-800 shadow-sm hover:bg-neutral-50 focus-visible:ring-primary-600',
  ghost: 'bg-transparent text-primary-800 hover:bg-primary-50 focus-visible:ring-primary-600',
  danger: 'bg-error text-white shadow-sm hover:bg-error/90 focus-visible:ring-error',
  amber: 'bg-accent-500 text-primary-800 shadow-sm hover:bg-accent-500/90 focus-visible:ring-accent-500',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 px-3 text-caption font-semibold',
  md: 'h-[42px] gap-2 px-4 text-body font-semibold',
  lg: 'h-12 gap-2.5 px-5 text-body-lg font-semibold',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, disabled, iconLeft, iconRight, children, className, ...props },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  )
)

Button.displayName = 'Button'
