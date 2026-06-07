import { format, formatDistanceToNow } from 'date-fns'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  type LucideIcon,
} from 'lucide-react'
import { Badge, type BadgeVariant } from '../../components/ui/Badge'
import type { ClientJobStatus, ClientMilestoneStatus, InvoiceStatus, TicketStatus } from '../../api/clientPortal'

export const usd = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export const dateShort = (value: string) => format(new Date(value), 'dd MMM yyyy')

export const relativeTime = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true })

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-lg border border-border bg-white shadow-sm ${className}`}>{children}</section>
)

export const SectionHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) => (
  <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </div>
    {action}
  </div>
)

export const SkeletonBlock = ({ className = 'h-72' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg border border-border bg-white p-5 shadow-sm ${className}`}>
    <div className="h-4 w-36 rounded bg-slate-100" />
    <div className="mt-5 h-8 w-56 rounded bg-slate-100" />
    <div className="mt-6 space-y-3">
      <div className="h-3 rounded bg-slate-100" />
      <div className="h-3 w-4/5 rounded bg-slate-100" />
      <div className="h-3 w-2/3 rounded bg-slate-100" />
    </div>
  </div>
)

const statusTone: Record<ClientJobStatus | ClientMilestoneStatus | InvoiceStatus | TicketStatus, BadgeVariant> = {
  Draft: 'suspended',
  'Under Review': 'pending',
  Active: 'active',
  Completed: 'completed',
  Pending: 'pending',
  Paid: 'approved',
  Released: 'completed',
  Overdue: 'rejected',
  Open: 'info',
  'In Progress': 'pending',
  Resolved: 'approved',
}

export const clientStatusBadge = (status: ClientJobStatus | ClientMilestoneStatus | InvoiceStatus | TicketStatus) => (
  <Badge variant={statusTone[status]}>{status}</Badge>
)

export const milestoneIcon = (status: ClientMilestoneStatus): LucideIcon => {
  if (status === 'Released') return CheckCircle2
  if (status === 'Paid') return CheckCircle2
  if (status === 'Overdue') return AlertCircle
  return Clock
}

export const safeInvoiceDescription = (projectName: string) => `Bridgr services for ${projectName}`

export const PrivacyNote = () => (
  <div className="flex items-start gap-3 rounded-lg border border-blue/20 bg-blue-tint p-4 text-sm text-navy">
    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue" />
    <p className="leading-6">
      All updates and support messages are handled by the Bridgr team as your single point of contact.
    </p>
  </div>
)
