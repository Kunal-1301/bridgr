import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import * as Dialog from '@radix-ui/react-dialog'
import { Copy, HelpCircle } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { StatCard } from '../../components/ui/StatCard'
import { getPayments, getReferralStats, workerKeys } from '../../api/worker'
import { useToast } from '../../components/ui/toastStore'
import { Card, SectionHeader, SkeletonBlock, WorkerPageTitle, dateShort, money, statusBadge } from './workerUtils'

type WorkerPaymentItem = {
  id: string
  projectId: string | null
  amount: number
  currency: string
  status: string
  paymentMethod: string
  createdAt: string
  // mock-compat fields
  project?: string
  milestone?: string
  date?: string
}

const methodLabel = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export const WorkerPaymentsPage = () => {
  const [tab, setTab] = useState<'earnings' | 'referrals'>('earnings')
  const [queryOpen, setQueryOpen] = useState(false)
  const { notify } = useToast()

  const paymentsQuery = useQuery({ queryKey: workerKeys.payments('me'), queryFn: () => getPayments() })
  const referrals = useQuery({ queryKey: workerKeys.referrals(), queryFn: getReferralStats })

  const rawData = paymentsQuery.data as any
  const items: WorkerPaymentItem[] = useMemo(() => {
    if (!rawData) return []
    // Real API: Page<WorkerPaymentOut> → { items, total, ... }
    if (Array.isArray(rawData.items)) return rawData.items
    // Mock fallback: { earnings: [...] }
    if (Array.isArray(rawData.earnings)) return rawData.earnings.map((r: any) => ({
      id: r.id,
      projectId: null,
      amount: r.amount,
      currency: 'INR',
      status: r.status?.toLowerCase() ?? 'pending',
      paymentMethod: 'bank_transfer',
      createdAt: r.date ?? new Date().toISOString(),
      project: r.project,
      milestone: r.milestone,
    }))
    return []
  }, [rawData])

  const totalEarned = useMemo(() => items.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0), [items])
  const pendingPayout = useMemo(() => items.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0), [items])

  const columns: ColumnDef<WorkerPaymentItem>[] = [
    { accessorKey: 'project', header: 'Project', cell: ({ row }) => row.original.project ?? row.original.projectId ?? '—' },
    { accessorKey: 'milestone', header: 'Milestone', cell: ({ row }) => row.original.milestone ?? '—' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => money(row.original.amount) },
    { accessorKey: 'paymentMethod', header: 'Method', cell: ({ row }) => methodLabel(row.original.paymentMethod) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => dateShort(row.original.createdAt ?? row.original.date) },
  ]

  if (paymentsQuery.isLoading) return <SkeletonBlock className="h-72" />

  return (
    <div className="space-y-6">
      <WorkerPageTitle
        title="Payments"
        subtitle="Your outbound payout records from Bridgr. Only your own payouts are shown."
        action={<button onClick={() => setQueryOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><HelpCircle className="h-4 w-4" /> Raise a Query</button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Earned" value={money(rawData?.totalEarned ?? totalEarned)} />
        <StatCard title="Pending Payout" value={money(rawData?.pendingPayout ?? pendingPayout)} />
        <StatCard title="This Month" value={money(rawData?.thisMonth ?? 0)} />
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('earnings')} className={`rounded-md px-4 py-2 text-sm font-bold ${tab === 'earnings' ? 'bg-blue text-white' : 'bg-white text-muted'}`}>Earnings</button>
        <button onClick={() => setTab('referrals')} className={`rounded-md px-4 py-2 text-sm font-bold ${tab === 'referrals' ? 'bg-blue text-white' : 'bg-white text-muted'}`}>Referral Earnings</button>
      </div>

      {tab === 'earnings' ? (
        <DataTable columns={columns} data={items} searchColumnId="project" />
      ) : (
        <Card className="p-5">
          <div className="flex flex-col gap-3 rounded-lg bg-surface p-4 md:flex-row md:items-center md:justify-between">
            <p className="font-mono text-sm text-navy">{referrals.data?.link}</p>
            <button onClick={() => { navigator.clipboard.writeText(referrals.data?.link || ''); notify({ kind: 'success', title: 'Referral link copied' }) }} className="inline-flex items-center gap-2 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white"><Copy className="h-4 w-4" /> Copy</button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <StatCard title="Referred" value={referrals.data?.referredCount ?? 0} />
            <StatCard title="Converted" value={referrals.data?.conversionCount ?? 0} />
            <StatCard title="Earnings" value={money(referrals.data?.earnings ?? 0)} />
          </div>
          {(referrals.data as any)?.breakdown && (
            <Card className="mt-4">
              <SectionHeader title="Per-Project Breakdown" />
              <div className="divide-y divide-border">
                {(referrals.data as any).breakdown.map((item: any) => (
                  <details key={item.project} className="p-5">
                    <summary className="cursor-pointer font-bold text-navy">{item.project}</summary>
                    <div className="mt-4 space-y-2">{item.milestones?.map((r: any) => <p key={r.id} className="text-sm text-muted">{r.milestone}: {money(r.amount)} · {r.status}</p>)}</div>
                  </details>
                ))}
              </div>
            </Card>
          )}
        </Card>
      )}

      <Dialog.Root open={queryOpen} onOpenChange={setQueryOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-bold text-navy">Payment query</Dialog.Title>
            <textarea defaultValue="Category: Payment" className="mt-4 min-h-32 w-full rounded-md border border-border p-3 text-sm" />
            <button onClick={() => { setQueryOpen(false); notify({ kind: 'success', title: 'Support ticket drafted' }) }} className="mt-4 w-full rounded-md bg-blue px-4 py-3 text-sm font-bold text-white">Submit Query</button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
