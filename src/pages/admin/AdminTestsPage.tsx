import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { adminKeys, getAdminTests } from '../../api/admin'
import { Card, SectionHeader, dateShort, inr } from './adminUtils'

export const AdminTestsPage = () => {
  const [open, setOpen] = useState(false)
  const tests = useQuery({ queryKey: adminKeys.tests(), queryFn: getAdminTests })
  const columns: ColumnDef<any>[] = [
    { accessorKey: 'name', header: 'Test Name' }, { accessorKey: 'category', header: 'Skill Category' }, { accessorKey: 'questions', header: 'Questions' },
    { accessorKey: 'timeLimit', header: 'Time Limit', cell: ({ row }) => `${row.original.timeLimit} min` }, { accessorKey: 'passThreshold', header: 'Pass Threshold', cell: ({ row }) => `${row.original.passThreshold}%` },
    { accessorKey: 'fee', header: 'Fee', cell: ({ row }) => inr(row.original.fee) }, { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant="active">{row.original.status}</Badge> }, { accessorKey: 'results', header: 'Results Count' },
  ]
  return <div className="space-y-6"><PageHeader title="Test Management" subtitle="Create skill tests, manage question banks, and inspect results." action={<button onClick={() => setOpen(!open)} className="rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white">Create/Edit Test</button>} />{open && <Card className="p-5"><div className="grid gap-4 md:grid-cols-3"><input placeholder="Test name" className="rounded-md border border-border px-3 py-2 text-sm" /><input placeholder="Skill category" className="rounded-md border border-border px-3 py-2 text-sm" /><label className="text-sm font-bold text-navy">Pass threshold 70%<input type="range" defaultValue={70} className="mt-2 w-full accent-blue" /></label><input type="number" defaultValue={30} className="rounded-md border border-border px-3 py-2 text-sm" /><select className="rounded-md border border-border px-3 py-2 text-sm"><option>₹0</option><option>₹99</option><option>₹199</option><option>₹299</option></select><label className="flex items-center gap-2 text-sm font-bold text-navy"><input type="checkbox" defaultChecked className="accent-blue" /> Active</label></div></Card>}<DataTable columns={columns} data={tests.data?.tests || []} searchColumnId="name" /><div className="grid gap-6 xl:grid-cols-2"><Card><SectionHeader title="Question Bank Manager" /><div className="divide-y divide-border">{tests.data?.questions.map((q) => <div key={q.id} className="p-4"><p className="font-bold text-navy">{q.text}</p><p className="mt-1 text-sm text-muted">{q.options.join(' / ')} · Correct {q.correct}</p><p className="mt-1 text-xs text-muted">{q.explanation}</p></div>)}</div><button className="m-4 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white">Bulk import CSV</button></Card><Card><SectionHeader title="Test Results" /><div className="divide-y divide-border">{tests.data?.results.map((r) => <div key={r.id} className="grid gap-2 p-4 md:grid-cols-5"><span className="font-bold text-navy">{r.worker}</span><span>{dateShort(r.attemptDate)}</span><span>{r.score}%</span><span>{r.passed ? 'Pass' : 'Fail'}</span><span>{r.timeTaken}</span></div>)}</div></Card></div></div>
}
