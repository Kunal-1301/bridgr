import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Link } from 'react-router-dom'
import { Eye, PlusCircle } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { type ClientJob, type ClientJobStatus } from '../../api/clientPortal'
import { useClientJobs } from '../../hooks/api'
import { Card, SkeletonBlock, clientStatusBadge, dateShort, usd } from './clientUtils'

const tabs: Array<'All' | ClientJobStatus> = ['All', 'Draft', 'Under Review', 'Active', 'Completed']

export const ClientJobsPage = () => {
  const [tab, setTab] = useState<(typeof tabs)[number]>('All')
  const jobs = useClientJobs()
  const filtered = useMemo(() => (jobs.data || []).filter((job) => tab === 'All' || job.status === tab), [jobs.data, tab])

  const columns: ColumnDef<ClientJob>[] = [
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="font-semibold text-navy">{row.original.title}</span> },
    { accessorKey: 'submissionDate', header: 'Submission Date', cell: ({ row }) => dateShort(row.original.submissionDate) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => clientStatusBadge(row.original.status) },
    { accessorKey: 'budget', header: 'Budget', cell: ({ row }) => usd(row.original.budget) },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Link to={`/c/jobs/${row.original.id}`} className="inline-flex items-center gap-2 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white">
          <Eye className="h-3.5 w-3.5" /> View
        </Link>
      ),
    },
  ]

  if (jobs.isLoading) return <SkeletonBlock />

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Jobs"
        subtitle="Review submitted jobs, active projects, and completed engagements."
        action={<Link to="/c/jobs/new" className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><PlusCircle className="h-4 w-4" /> Submit Job</Link>}
      />
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-md px-4 py-2 text-sm font-bold ${tab === item ? 'bg-blue text-white' : 'bg-surface text-muted hover:text-navy'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </Card>
      {filtered.length ? (
        <DataTable columns={columns} data={filtered} searchColumnId="title" searchPlaceholder="Search jobs..." />
      ) : (
        <EmptyState title="No jobs found" description="Submitted jobs will appear here after they are saved or sent for review." />
      )}
    </div>
  )
}
