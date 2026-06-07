import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { UploadCloud } from 'lucide-react'
import { cn } from '../cn'

interface FileUploadBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  title?: string
  description?: string
  actionLabel?: string
  icon?: ReactNode
  error?: string
}

export const FileUploadBox = forwardRef<HTMLInputElement, FileUploadBoxProps>(
  ({ title = 'Upload file', description, actionLabel = 'Choose file', icon, error, className, id, ...props }, ref) => {
    const inputId = id ?? props.name ?? 'bridgr-file-upload'

    return (
      <div className={cn('space-y-1.5', className)}>
        <label
          htmlFor={inputId}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-white px-5 py-8 text-center shadow-sm transition',
            'hover:border-primary-400 hover:bg-primary-50/60',
            error ? 'border-error' : 'border-neutral-200'
          )}
        >
          <span className="mb-3 rounded-lg bg-primary-50 p-3 text-primary-600">
            {icon ?? <UploadCloud className="h-6 w-6" />}
          </span>
          <span className="text-subhead text-primary-800">{title}</span>
          {description && <span className="mt-1 max-w-sm text-body text-neutral-600">{description}</span>}
          <span className="mt-4 rounded-sm border border-neutral-200 bg-white px-3 py-2 text-caption font-bold uppercase text-primary-800 shadow-sm">
            {actionLabel}
          </span>
          <input ref={ref} id={inputId} type="file" className="sr-only" {...props} />
        </label>
        {error && <p className="text-caption text-error">{error}</p>}
      </div>
    )
  }
)

FileUploadBox.displayName = 'FileUploadBox'
