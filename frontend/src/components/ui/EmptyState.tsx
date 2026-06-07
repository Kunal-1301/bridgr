import { FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  actionText?: string
  onAction?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

export const EmptyState = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = FolderOpen,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-border rounded-lg shadow-sm">
      {/* SVG Illustration wrapper */}
      <div className="w-16 h-16 rounded-full bg-blue-tint text-blue flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-bold text-navy mb-1.5">{title}</h3>
      <p className="text-sm text-muted max-w-sm leading-relaxed mb-6">
        {description}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 rounded-md bg-blue text-white text-sm font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue/50 transition-all shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  )
}
