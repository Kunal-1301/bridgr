import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/toastStore'
import { adminKeys, getAdminPayments, markClientPaymentReceived, markWorkerPayoutPaid } from '../../api/admin'
import { Card, dateShort, inr, usd } from './adminUtils'

type PaymentItem = {
  id: string
  projectId: string | null
  clientId: string | null
  workerId: string | null
  amount: number
  currency: string
  paymentDirection: 'inbound_client_payment' | 'outbound_worker_payout'
  paymentMethod: string
  status: string
  createdAt: string
}

const statusBadge = (status: string) =>
  status === 'pending' ? <Badge variant="pending">Pending</Badge>
  : status === 'received' || status === 'paid' ? <Badge variant="approved">{status}</Badge>
  : <Badge variant="suspended">{status}</Badge>

const methodLabel = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export const AdminPaymentsPage = () => {
  const [tab, setTab] = useState<'inbound' | 'outbound'>('inbound')
  const [clientFormOpen, setClientFormOpen] = useState(false)
  const [workerFormOpen, setWorkerFormOpen] = useState(false)
  const [clientForm, setClientForm] = useState({ clientId: '', amount: '', currency: 'USD', paymentMethod: 'bank_transfer', notes: '' })
  const [workerForm, setWorkerForm] = useState({ workerId: '', amount: '', currency: 'INR', paymentMethod: 'upi', notes: '' })
  const { notify } = useToast()
  const queryClient = useQueryClient()

  const paymentsQuery = useQuery({ queryKey: adminKeys.payments(), queryFn: () => getAdminPayments() })
  const items: PaymentItem[] = paymentsQuery.data?.items ?? []

  const inbound = useMemo(() => items.filter((p) => p.paymentDirection === 'inbound_client_payment'), [items])
  const outbound = useMemo(() => items.filter((p) => p.paymentDirection === 'outbound_worker_payout'), [items])

  const totalInbound = inbound.reduce((s, p) => s + p.amount, 0)
  const totalOutbound = outbound.reduce((s, p) => s + p.amount, 0)
  const pendingInbound = inbound.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)

  const markClient = useMutation({
    mutationFn: () => markClientPaymentReceived({
      paymentId: '',
      amount: Number(clientForm.amount),
      method: clientForm.paymentMethod,
      notes: clientForm.notes,
    } as any),
    onSuccess: () => {
      notify({ kind: 'success', title: 'Client payment recorded' })
      setClientFormOpen(false)
      queryClient.invalidateQueries({ queryKey: adminKeys.payments() })
    },
    onError: () => notify({ kind: 'error', title: 'Failed to record payment' }),
  })

  const markWorker = useMutation({
    mutationFn: () => markWorkerPayoutPaid({
      paymentId: '',
      amount: Number(workerForm.amount),
      method: workerForm.paymentMethod,
      notes: workerForm.notes,
    } as any),
    onSuccess: () => {
      notify({ kind: 'success', title: 'Worker payout recorded' })
      setWorkerFormOpen(false)
      queryClient.invalidateQueries({ queryKey: adminKeys.payments() })
    },
    onError: () => notify({ kind: 'error', title: 'Failed to record payout' }),
  })

  const inboundColumns: ColumnDef<PaymentItem>[] = [
    { accessorKey: 'id', header: 'ID', cell: ({ row }) => <span className="font-mono text-xs text-muted">{String(row.original.id).slice(0, 8)}…</span> },
    { accessorKey: 'clientId', header: 'Client ID', cell: ({ row }) => <span className="font-mono text-xs">{row.original.clientId ?? '—'}</span> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => usd(row.original.amount) },
    { accessorKey: 'paymentMethod', header: 'Method', cell: ({ row }) => methodLabel(row.original.paymentMethod) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => dateShort(row.original.createdAt) },
  ]

  const outboundColumns: ColumnDef<PaymentItem>[] = [
    { accessorKey: 'id', header: 'ID', cell: ({ row }) => <span className="font-mono text-xs text-muted">{String(row.original.id).slice(0, 8)}…</span> },
    { accessorKey: 'workerId', header: 'Worker ID', cell: ({ row }) => <span className="font-mono text-xs">{row.original.workerId ?? '—'}</span> },
    { accessorKey: 'amount', header: 'Amount (INR)', cell: ({ row }) => inr(row.original.amount) },
    { accessorKey: 'paymentMethod', header: 'Method', cell: ({ row }) => methodLabel(row.original.paymentMethod) },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => dateShort(row.original.createdAt) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Ledger"
        subtitle="Admin-only ledger. Client inbound payments and worker payouts are never cross-visible."
        action={
          <div className="flex gap-2">
            <button onClick={() => setClientFormOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white">
              <Plus className="h-4 w-4" /> Mark Client Received
            </button>
            <button onClick={() => setWorkerFormOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2.5 text-sm font-bold text-white">
              <Plus className="h-4 w-4" /> Mark Worker Payout
            </button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Inbound" value={usd(totalInbound)} />
        <StatCard title="Total Outbound" value={inr(totalOutbound)} />
        <StatCard title="Outstanding (inbound)" value={usd(pendingInbound)} className={pendingInbound > 0 ? 'border-amber/40' : ''} />
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          {(['inbound', 'outbound'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-2 text-sm font-bold capitalize ${tab === t ? 'bg-blue text-white' : 'bg-surface text-muted'}`}>{t}</button>
          ))}
        </div>
      </Card>

      <DataTable
        columns={tab === 'inbound' ? inboundColumns : outboundColumns}
        data={tab === 'inbound' ? inbound : outbound}
        searchColumnId="id"
      />

      {/* Mark Client Payment Received */}
      <Dialog.Root open={clientFormOpen} onOpenChange={setClientFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-bold text-navy">Mark Client Payment Received</Dialog.Title>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted">Client ID</label>
                <input value={clientForm.clientId} onChange={(e) => setClientForm({ ...clientForm, clientId: e.target.value })} placeholder="UUID of client profile" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted">Amount (USD)</label>
                <input type="number" value={clientForm.amount} onChange={(e) => setClientForm({ ...clientForm, amount: e.target.value })} placeholder="0.00" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted">Payment Method</label>
                <select value={clientForm.paymentMethod} onChange={(e) => setClientForm({ ...clientForm, paymentMethod: e.target.value })} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
                  {['bank_transfer', 'stripe', 'wise', 'paypal', 'manual'].map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted">Notes (optional)</label>
                <textarea value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <button onClick={() => markClient.mutate()} disabled={!clientForm.clientId || !clientForm.amount || markClient.isPending} className="w-full rounded-md bg-blue px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {markClient.isPending ? 'Recording…' : 'Record Payment'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Mark Worker Payout Paid */}
      <Dialog.Root open={workerFormOpen} onOpenChange={setWorkerFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-bold text-navy">Mark Worker Payout Paid</Dialog.Title>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted">Worker ID</label>
                <input value={workerForm.workerId} onChange={(e) => setWorkerForm({ ...workerForm, workerId: e.target.value })} placeholder="UUID of worker profile" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted">Amount (INR)</label>
                <input type="number" value={workerForm.amount} onChange={(e) => setWorkerForm({ ...workerForm, amount: e.target.value })} placeholder="0.00" className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted">Payment Method</label>
                <select value={workerForm.paymentMethod} onChange={(e) => setWorkerForm({ ...workerForm, paymentMethod: e.target.value })} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
                  {['upi', 'bank_transfer', 'razorpay', 'wise', 'manual'].map((m) => <option key={m} value={m}>{methodLabel(m)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-muted">Notes (optional)</label>
                <textarea value={workerForm.notes} onChange={(e) => setWorkerForm({ ...workerForm, notes: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
              </div>
              <button onClick={() => markWorker.mutate()} disabled={!workerForm.workerId || !workerForm.amount || markWorker.isPending} className="w-full rounded-md bg-success px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {markWorker.isPending ? 'Recording…' : 'Record Payout'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
