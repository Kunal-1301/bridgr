import { format, formatDistanceToNow } from 'date-fns'
import { Badge, type BadgeVariant } from '../../components/ui/Badge'
import type { ClientStatus, WorkerStatus } from '../../api/admin'

export const usd = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)

export const inr = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)

export const dateShort = (value: string) => format(new Date(value), 'dd MMM yyyy')

export const relativeTime = (value: string) => formatDistanceToNow(new Date(value), { addSuffix: true })

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-lg border border-border bg-white shadow-sm ${className}`}>{children}</section>
)

export const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => (
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

const workerStatusTone: Record<WorkerStatus, BadgeVariant> = {
  Pending: 'pending',
  Approved: 'approved',
  'Under Review': 'info',
  Rejected: 'rejected',
  Suspended: 'suspended',
  Flagged: 'flagged',
}

const clientStatusTone: Record<ClientStatus, BadgeVariant> = {
  Active: 'active',
  Inactive: 'suspended',
}

export const workerStatusBadge = (status: WorkerStatus) => <Badge variant={workerStatusTone[status]}>{status}</Badge>
export const clientStatusBadge = (status: ClientStatus) => <Badge variant={clientStatusTone[status]}>{status}</Badge>

export const TrustBar = ({ score }: { score: number }) => (
  <div className="min-w-28">
    <div className="flex items-center justify-between text-xs font-bold text-navy">
      <span>{score}/100</span>
    </div>
    <div className="mt-1.5 h-2 rounded-full bg-surface">
      <div className={`h-2 rounded-full ${score >= 80 ? 'bg-success' : score >= 60 ? 'bg-amber' : 'bg-error'}`} style={{ width: `${score}%` }} />
    </div>
  </div>
)

export const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
