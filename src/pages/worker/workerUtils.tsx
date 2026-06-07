import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import { Badge } from '../../components/ui/Badge'

export const money = (value: number) => `₹${value.toLocaleString('en-IN')}`
export const relativeDate = (value: string) => `in ${formatDistanceToNow(new Date(value))}`
export const dateShort = (value: string) => format(new Date(value), 'dd MMM yyyy')

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-lg border border-border bg-white shadow-sm ${className}`}>{children}</section>
)

export const SectionHeader = ({ title, action }: { title: string; action?: ReactNode }) => (
  <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
    <h2 className="text-base font-bold text-navy">{title}</h2>
    {action}
  </div>
)

export const SkeletonBlock = ({ className = 'h-24' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
)

export const PageSkeletonGrid = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => <SkeletonBlock key={index} className="h-32" />)}
  </div>
)

export const ProgressBar = ({ value, tone = 'bg-blue' }: { value: number; tone?: string }) => (
  <div className="h-2 overflow-hidden rounded-full bg-surface">
    <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
)

export const Initials = ({ value, className = '' }: { value: string; className?: string }) => (
  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-tint text-xs font-bold text-blue ${className}`}>
    {value}
  </span>
)

export const WorkerPageTitle = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <h1 className="text-2xl font-bold text-navy">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </div>
    {action}
  </div>
)

export const statusBadge = (status: string) => {
  const normalized = status.toLowerCase()
  if (['selected', 'released', 'approved', 'completed'].includes(normalized)) return <Badge variant="approved">{status}</Badge>
  if (['rejected', 'failed'].includes(normalized)) return <Badge variant="rejected">{status}</Badge>
  if (['active', 'passed'].includes(normalized)) return <Badge variant="active">{status}</Badge>
  if (['shortlisted', 'interview scheduled'].includes(normalized)) return <Badge variant="info">{status}</Badge>
  return <Badge variant="pending">{status}</Badge>
}

export const LinkButton = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className="rounded-md bg-blue px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-600">
    {children}
  </Link>
)
