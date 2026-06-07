import { Badge } from './Badge'

export type StatusBadgeStatus = 'approved' | 'pending' | 'rejected' | 'scheduled' | 'draft'

interface StatusBadgeProps {
  status: StatusBadgeStatus
  label?: string
  className?: string
}

const statusConfig: Record<StatusBadgeStatus, { label: string; variant: 'neutral' | 'success' | 'warning' | 'error' | 'info' }> = {
  approved: { label: 'Approved', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  rejected: { label: 'Rejected', variant: 'error' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  draft: { label: 'Draft', variant: 'neutral' },
}

export const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={className}>
      {label ?? config.label}
    </Badge>
  )
}
