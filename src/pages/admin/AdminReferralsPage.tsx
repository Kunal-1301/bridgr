import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Wallet } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/toastStore'
import { adminKeys, adminPostAction, getAdminReferrals, type ReferralStatus } from '../../api/admin'
import { Card, SectionHeader, dateShort, inr } from './adminUtils'

export const AdminReferralsPage = () => {
  const [tab, setTab] = useState<'referrals' | 'affiliates'>('referrals')
  const [selected, setSelected] = useState<string[]>([])
  const referrals = useQuery({ queryKey: adminKeys.referrals(), queryFn: getAdminReferrals })
  const { notify } = useToast()
  const payout = useMutation({ mutationFn: () => adminPostAction('/referrals/payout', { selected }), onSuccess: () => notify({ kind: 'success', title: 'Referral payout released' }) })
  const columns: ColumnDef<any>[] = [
    { id: 'select', header: '', cell: ({ row }) => <input type="checkbox" checked={selected.includes(row.original.id)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, row.original.id] : current.filter((id) => id !== row.original.id))} className="h-4 w-4 accent-blue" /> },
    { accessorKey: 'referrer', header: 'Referrer', cell: ({ row }) => <div><p className="font-bold text-navy">{row.original.referrer}</p><p className="font-mono text-xs text-muted">{row.original.code}</p></div> },
    { accessorKey: 'referredUser', header: 'Referred User' }, { accessorKey: 'type', header: 'Type' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => referralBadge(row.original.status) },
    { accessorKey: 'amount', header: 'Amount Earned', cell: ({ row }) => inr(row.original.amount) },
    { accessorKey: 'date', header: 'Date', cell: ({ row }) => dateShort(row.original.date) },
  ]
  return <div className="space-y-6"><PageHeader title="Referral Management" subtitle="Worker referrals and external affiliate growth." action={<button onClick={() => payout.mutate()} disabled={!selected.length} className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Wallet className="h-4 w-4" /> Release Payout</button>} /><div className="grid gap-4 md:grid-cols-4"><StatCard title="Total Referrals" value={referrals.data?.stats.total || 0} /><StatCard title="Conversions" value={referrals.data?.stats.conversions || 0} /><StatCard title="Pending Payouts" value={inr(referrals.data?.stats.pending || 0)} /><StatCard title="Paid Out" value={inr(referrals.data?.stats.paid || 0)} /></div><Card className="p-4"><div className="flex gap-2"><button onClick={() => setTab('referrals')} className={`rounded-md px-4 py-2 text-sm font-bold ${tab === 'referrals' ? 'bg-blue text-white' : 'bg-surface text-muted'}`}>All Referrals</button><button onClick={() => setTab('affiliates')} className={`rounded-md px-4 py-2 text-sm font-bold ${tab === 'affiliates' ? 'bg-blue text-white' : 'bg-surface text-muted'}`}>Affiliates</button></div></Card>{tab === 'referrals' ? <DataTable columns={columns} data={referrals.data?.rows || []} searchColumnId="referrer" /> : <Card><SectionHeader title="Affiliates" action={<button className="inline-flex items-center gap-2 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Add Affiliate</button>} /><div className="divide-y divide-border">{referrals.data?.affiliates.map((a) => <div key={a.id} className="grid gap-3 p-5 md:grid-cols-5"><strong className="text-navy">{a.company}</strong><span>{a.contact}</span><span>{a.commission}</span><span>{a.clicks}/{a.signups}/{a.conversions}</span><span>{inr(a.earned)}</span></div>)}</div></Card>}</div>
}
const referralBadge = (status: ReferralStatus) => status === 'Paid' ? <Badge variant="approved">{status}</Badge> : status === 'Converted' ? <Badge variant="info">{status}</Badge> : <Badge variant="pending">{status}</Badge>
