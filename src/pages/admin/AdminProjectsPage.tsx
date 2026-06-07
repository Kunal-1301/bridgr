import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { adminKeys, getAdminProjects, type AdminProject, type AdminProjectStatus } from '../../api/admin'
import { Card, dateShort } from './adminUtils'

const statuses: Array<'All' | AdminProjectStatus> = ['All', 'Active', 'Completed', 'Paused']

export const AdminProjectsPage = () => {
  const [status, setStatus] = useState<(typeof statuses)[number]>('All')
  const [client, setClient] = useState('All')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const projects = useQuery({ queryKey: adminKeys.projects({ status, client, from, to }), queryFn: () => getAdminProjects({ status, client, from, to }) })
  const clients = useMemo(() => ['All', ...new Set((projects.data || []).map((project) => project.client))], [projects.data])
  const data = useMemo(() => (projects.data || []).filter((project) => {
    const statusOk = status === 'All' || project.status === status
    const clientOk = client === 'All' || project.client === client
    const start = new Date(project.startDate).getTime()
    const fromOk = !from || start >= new Date(from).getTime()
    const toOk = !to || start <= new Date(to).getTime()
    return statusOk && clientOk && fromOk && toOk
  }), [projects.data, status, client, from, to])

  const columns: ColumnDef<AdminProject>[] = [
    { accessorKey: 'title', header: 'Project Title', cell: ({ row }) => <span className="font-bold text-navy">{row.original.title}</span> },
    { accessorKey: 'client', header: 'Client' },
    { accessorKey: 'workers', header: 'Workers', cell: ({ row }) => <div className="flex -space-x-2">{row.original.workers.map((worker) => <span key={worker.id} title={worker.name} className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-tint text-xs font-bold text-blue">{worker.initials}</span>)}</div> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => projectStatus(row.original.status) },
    { accessorKey: 'startDate', header: 'Start Date', cell: ({ row }) => dateShort(row.original.startDate) },
    { accessorKey: 'endDate', header: 'End Date', cell: ({ row }) => dateShort(row.original.endDate) },
    { id: 'actions', header: 'Actions', cell: ({ row }) => <Link to={`/admin/projects/${row.original.id}`} className="inline-flex items-center gap-2 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white"><Eye className="h-3.5 w-3.5" /> Open</Link> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" subtitle="All active and historical projects with full admin visibility." />
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-md border border-border px-3 py-2 text-sm">{statuses.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={client} onChange={(e) => setClient(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm">{clients.map((item) => <option key={item}>{item}</option>)}</select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm" />
        </div>
      </Card>
      <DataTable columns={columns} data={data} searchColumnId="title" searchPlaceholder="Search projects..." />
    </div>
  )
}

const projectStatus = (status: AdminProjectStatus) => {
  if (status === 'Active') return <Badge variant="active">{status}</Badge>
  if (status === 'Completed') return <Badge variant="completed">{status}</Badge>
  return <Badge variant="pending">{status}</Badge>
}
