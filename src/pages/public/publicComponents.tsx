import { forwardRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'

export const BridgrMark = ({ className = 'h-10 w-10' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <circle cx="8" cy="22" r="4" fill="currentColor" />
    <circle cx="24" cy="10" r="4" fill="currentColor" />
    <path d="M8 22C12 22 16 10 24 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M8 22C8 14 16 10 24 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" opacity=".55" />
  </svg>
)

export const BrandLockup = ({ light = false }: { light?: boolean }) => (
  <Link to="/" className={clsx('inline-flex items-center gap-3 font-bold', light ? 'text-white' : 'text-navy')}>
    <img
      src="/favicon.svg"
      alt=""
      width="36"
      height="36"
      loading={light ? 'eager' : 'lazy'}
      decoding="async"
      className="h-9 w-9"
    />
    <span className="text-xl">Bridgr</span>
  </Link>
)

export const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1.5 text-xs font-medium text-error">{message}</p> : null

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }>(
  ({ label, error, className, ...props }, ref) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase text-navy">{label}</span>
      <input
        ref={ref}
        {...props}
        className={clsx(
          'w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15',
          className
        )}
      />
      <FieldError message={error} />
    </label>
  )
)

TextInput.displayName = 'TextInput'

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }>(
  ({ label, error, className, ...props }, ref) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase text-navy">{label}</span>
      <textarea
        ref={ref}
        {...props}
        className={clsx(
          'min-h-28 w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15',
          className
        )}
      />
      <FieldError message={error} />
    </label>
  )
)

TextArea.displayName = 'TextArea'

export const SelectInput = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; children: ReactNode }>(
  ({ label, error, children, className, ...props }, ref) => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase text-navy">{label}</span>
      <select
        ref={ref}
        {...props}
        className={clsx(
          'w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/15',
          className
        )}
      >
        {children}
      </select>
      <FieldError message={error} />
    </label>
  )
)

SelectInput.displayName = 'SelectInput'

export const PrimaryButton = ({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={clsx(
      'inline-flex items-center justify-center rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60',
      className
    )}
  >
    {children}
  </button>
)

export const SuccessPanel = ({ title, body, action }: { title: string; body: string; action?: ReactNode }) => (
  <div className="mx-auto max-w-lg rounded-lg border border-border bg-white p-8 text-center shadow-md">
    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success-tint text-success">
      <span className="text-3xl font-bold leading-none" aria-hidden="true">✓</span>
    </div>
    <h1 className="text-2xl font-bold text-navy">{title}</h1>
    <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
)
