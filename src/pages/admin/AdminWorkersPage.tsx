import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { Download, Eye, ShieldCheck } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { TierBadge } from '../../components/ui/TierBadge'
import { useToast } from '../../components/ui/toastStore'
import { type AdminWorker, type WorkerStatus } from '../../api/admin'
import { useAdminWorkers, useWorkerVerificationActions } from '../../hooks/api'
import { Card, TrustBar, dateShort, workerStatusBadge } from './adminUtils'

const statuses: Array<'All' | WorkerStatus> = ['All', 'Pending', 'Approved', 'Suspended', 'Flagged', 'Rejected']
const tiers = ['All', 'newcomer', 'verified', 'certified', 'pro', 'elite']

export const AdminWorkersPage = () => {
  const [status, setStatus] = useState<(typeof statuses)[number]>('All')
  const [tier, setTier] = useState('All')
  const [skill, setSkill] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const { notify } = useToast()
  const workers = useAdminWorkers({ status, tier, skill })
  const { approveWorker: approve } = useWorkerVerificationActions()
  const approveWithToast = (id: string) => approve.mutate(id, { onSuccess: () => notify({ kind: 'success', title: 'Worker updated' }) })

  const filtered = useMemo(() => (workers.data || []).filter((worker) => {
    const statusMatch = status === 'All' || worker.status === status
    const tierMatch = tier === 'All' || worker.tier === tier
    const skillMatch = !skill || worker.skills.some((item) => item.toLowerCase().includes(skill.toLowerCase()))
    return statusMatch && tierMatch && skillMatch
  }), [workers.data, status, tier, skill])

  const columns: ColumnDef<AdminWorker>[] = [
    { id: 'select', header: '', cell: ({ row }) => <input type="checkbox" checked={selected.includes(row.original.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, row.original.id] : current.filter((id) => id !== row.original.id))} className="h-4 w-4 accent-blue" /> },
    { accessorKey: 'fullName', header: 'Name', cell: ({ row }) => <span className="font-bold text-navy">{row.original.fullName}</span> },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'city', header: 'City' },
    { accessorKey: 'skills', header: 'Skills', cell: ({ row }) => <div className="flex max-w-56 flex-wrap gap-1">{row.original.skills.slice(0, 3).map((item) => <span key={item} className="rounded-full bg-amber-tint px-2 py-0.5 text-[11px] font-bold text-navy">{item}</span>)}</div> },
    { accessorKey: 'tier', header: 'Tier', cell: ({ row }) => <TierBadge tier={row.original.tier} /> },
    { accessorKey: 'trustScore', header: 'Trust', cell: ({ row }) => <TrustBar score={row.original.trustScore} /> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => workerStatusBadge(row.original.status) },
    { accessorKey: 'joinedDate', header: 'Joined', cell: ({ row }) => dateShort(row.original.joinedDate) },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Link to={`/admin/workers/${row.original.id}`} className="inline-flex items-center gap-1 rounded-md bg-blue px-2.5 py-1.5 text-xs font-bold text-white"><Eye className="h-3.5 w-3.5" /> View</Link>
          {row.original.status === 'Pending' ? <button onClick={() => approveWithToast(row.original.id)} className="rounded-md bg-success px-2.5 py-1.5 text-xs font-bold text-white">Approve</button> : null}
          <button onClick={() => notify({ kind: 'info', title: 'Documents opened' })} className="rounded-md border border-border px-2.5 py-1.5 text-xs font-bold text-navy">Docs</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Worker Management"
        subtitle="Search, filter, verify, and manage the full worker pool."
        action={<button onClick={() => notify({ kind: 'info', title: 'CSV export prepared' })} className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><Download className="h-4 w-4" /> Export CSV</button>}
      />
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-md border border-border px-3 py-2 text-sm">
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm">
            {tiers.map((item) => <option key={item} value={item}>{item === 'All' ? 'All tiers' : item}</option>)}
          </select>
          <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Skill filter" className="rounded-md border border-border px-3 py-2 text-sm" />
          <button onClick={() => selected.forEach((id) => approveWithToast(id))} disabled={!selected.length} className="inline-flex items-center justify-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><ShieldCheck className="h-4 w-4" /> Bulk approve</button>
        </div>
      </Card>
      <DataTable columns={columns} data={filtered} searchColumnId="fullName" searchPlaceholder="Search name or email..." />
    </div>
  )
}
