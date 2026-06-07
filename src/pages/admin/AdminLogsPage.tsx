import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Download, Lock } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { adminKeys, getAdminLogs } from '../../api/admin'
import { Card, dateShort } from './adminUtils'

export const AdminLogsPage = () => {
  const [actor, setActor] = useState('All')
  const [action, setAction] = useState('All')
  const logs = useQuery({ queryKey: adminKeys.logs(), queryFn: getAdminLogs })
  const rows = useMemo(() => (logs.data || []).filter((log) => (actor === 'All' || log.actor.includes(actor)) && (action === 'All' || log.actionType === action)), [logs.data, actor, action])
  const columns: ColumnDef<any>[] = [{ accessorKey: 'timestamp', header: 'Timestamp', cell: ({ row }) => dateShort(row.original.timestamp) }, { accessorKey: 'actor', header: 'Actor' }, { accessorKey: 'actionType', header: 'Action Type' }, { accessorKey: 'description', header: 'Description' }, { accessorKey: 'affectedRecord', header: 'Affected Record' }, { accessorKey: 'ip', header: 'IP Address' }]
  return <div className="space-y-6"><PageHeader title="Audit Log" subtitle="Immutable read-only platform activity trail." action={<button className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><Download className="h-4 w-4" /> Export CSV</button>} /><Card className="flex items-start gap-3 p-4 text-sm text-navy"><Lock className="h-4 w-4 text-blue" /> Logs are read-only. No delete or edit actions are available.</Card><Card className="p-4"><div className="grid gap-3 md:grid-cols-4"><input placeholder="Search description" className="rounded-md border border-border px-3 py-2 text-sm" /><input type="date" className="rounded-md border border-border px-3 py-2 text-sm" /><select value={actor} onChange={(e) => setActor(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm"><option>All</option><option>Admin</option><option>Worker</option><option>Client</option><option>System</option></select><select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm"><option>All</option><option>Create</option><option>Update</option><option>Delete</option><option>Login</option><option>Status Change</option></select></div></Card><DataTable columns={columns} data={rows} searchColumnId="description" /></div>
}
