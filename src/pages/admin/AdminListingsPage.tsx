import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { adminKeys, getAdminListings, type AdminListing, type ListingStatus, type ListingVisibility } from '../../api/admin'
import { Card, dateShort, usd } from './adminUtils'

const statuses: Array<'All' | ListingStatus> = ['All', 'Draft', 'Open', 'In Progress', 'Closed']
const visibilities: Array<'All' | ListingVisibility> = ['All', 'Open', 'Skills-filtered', 'Invite-only']

export const AdminListingsPage = () => {
  const [status, setStatus] = useState<(typeof statuses)[number]>('All')
  const [visibility, setVisibility] = useState<(typeof visibilities)[number]>('All')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const listings = useQuery({ queryKey: adminKeys.listings({ status, visibility, from, to }), queryFn: () => getAdminListings({ status, visibility, from, to }) })

  const data = useMemo(() => (listings.data || []).filter((item) => {
    const statusOk = status === 'All' || item.status === status
    const visibilityOk = visibility === 'All' || item.visibility === visibility
    const created = new Date(item.created).getTime()
    const fromOk = !from || created >= new Date(from).getTime()
    const toOk = !to || created <= new Date(to).getTime()
    return statusOk && visibilityOk && fromOk && toOk
  }), [listings.data, status, visibility, from, to])

  const columns: ColumnDef<AdminListing>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="font-bold text-navy">{row.original.title}</span> },
    { accessorKey: 'sourceJobTitle', header: 'Source Job', cell: ({ row }) => <Link to={`/admin/jobs/inbox/${row.original.sourceJobId}`} className="font-bold text-blue hover:underline">{row.original.sourceJobTitle}</Link> },
    { accessorKey: 'workerBudget', header: 'Worker Budget', cell: ({ row }) => usd(row.original.workerBudget) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => listingStatus(row.original.status) },
    { accessorKey: 'visibility', header: 'Visibility' },
    { accessorKey: 'applications', header: 'Applications' },
    { accessorKey: 'created', header: 'Created', cell: ({ row }) => dateShort(row.original.created) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Listings"
        subtitle="Worker-facing listings derived from private client submissions."
        action={<Link to="/admin/jobs/new" className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><PlusCircle className="h-4 w-4" /> Create New Listing</Link>}
      />
      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="rounded-md border border-border px-3 py-2 text-sm">{statuses.map((item) => <option key={item}>{item}</option>)}</select>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)} className="rounded-md border border-border px-3 py-2 text-sm">{visibilities.map((item) => <option key={item}>{item}</option>)}</select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm" />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm" />
        </div>
      </Card>
      <DataTable columns={columns} data={data} searchColumnId="title" searchPlaceholder="Search listings..." />
    </div>
  )
}

const listingStatus = (status: ListingStatus) => {
  if (status === 'Open') return <Badge variant="active">{status}</Badge>
  if (status === 'In Progress') return <Badge variant="info">{status}</Badge>
  if (status === 'Closed') return <Badge variant="completed">{status}</Badge>
  return <Badge variant="pending">{status}</Badge>
}
