import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import * as Dialog from '@radix-ui/react-dialog'
import { Building2, Copy, Plus, Save, X } from 'lucide-react'
import { DataTable } from '../../components/ui/DataTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/toastStore'
import { adminKeys, createAdminClient, getAdminClients, updateAdminClient, type AdminClient } from '../../api/admin'
import { Card, SectionHeader, clientStatusBadge, dateShort, usd } from './adminUtils'

export const AdminClientsPage = () => {
  const clients = useQuery({ queryKey: adminKeys.clients(), queryFn: getAdminClients })
  const [addOpen, setAddOpen] = useState(false)
  const [selected, setSelected] = useState<AdminClient | null>(null)
  const [form, setForm] = useState({ company: '', country: 'United States', contact: '', email: '' })
  const [inviteLink, setInviteLink] = useState('')
  const { notify } = useToast()
  const createClient = useMutation({
    mutationFn: () => createAdminClient(form),
    onSuccess: (result) => {
      setInviteLink(result.inviteLink)
      notify({ kind: 'success', title: 'Client created', message: 'Invite link generated.' })
    },
  })
  const saveClient = useMutation({
    mutationFn: () => selected ? updateAdminClient(selected.id, selected) : Promise.resolve({ ok: true }),
    onSuccess: () => notify({ kind: 'success', title: 'Client updated' }),
  })

  const columns: ColumnDef<AdminClient>[] = [
    { accessorKey: 'company', header: 'Company', cell: ({ row }) => <button onClick={() => setSelected(row.original)} className="font-bold text-blue hover:underline">{row.original.company}</button> },
    { accessorKey: 'contact', header: 'Contact' },
    { accessorKey: 'country', header: 'Country' },
    { accessorKey: 'activeProjects', header: 'Active Projects' },
    { accessorKey: 'totalSpent', header: 'Total Spent', cell: ({ row }) => usd(row.original.totalSpent) },
    { accessorKey: 'joined', header: 'Joined', cell: ({ row }) => dateShort(row.original.joined) },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelected(row.original)} className="rounded-md bg-blue px-3 py-2 text-xs font-bold text-white">View</button>
          <button onClick={() => setSelected(row.original)} className="rounded-md border border-border px-3 py-2 text-xs font-bold text-navy">Edit</button>
          <button onClick={() => notify({ kind: 'info', title: 'Client deactivated' })} className="rounded-md bg-error px-3 py-2 text-xs font-bold text-white">Deactivate</button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Management"
        subtitle="Admin-only client records, spending, projects, and invite management."
        action={<button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Add New Client</button>}
      />
      <DataTable columns={columns} data={clients.data || []} searchColumnId="company" searchPlaceholder="Search clients..." />

      <Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/60" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-bold text-navy">Add New Client</Dialog.Title>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Text label="Company name" value={form.company} onChange={(value) => setForm({ ...form, company: value })} />
              <Text label="Country" value={form.country} onChange={(value) => setForm({ ...form, country: value })} />
              <Text label="Contact person" value={form.contact} onChange={(value) => setForm({ ...form, contact: value })} />
              <Text label="Email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            </div>
            <button onClick={() => createClient.mutate()} className="mt-5 w-full rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white">Create Client & Generate Invite</button>
            {inviteLink ? (
              <div className="mt-4 rounded-lg bg-surface p-4">
                <p className="text-xs font-bold uppercase text-muted">Invite Link</p>
                <div className="mt-2 flex gap-2">
                  <input value={inviteLink} readOnly className="min-w-0 flex-1 rounded-md border border-border px-3 py-2 text-sm" />
                  <button onClick={() => { navigator.clipboard.writeText(inviteLink); notify({ kind: 'success', title: 'Invite copied' }) }} className="rounded-md bg-amber px-3 py-2 text-navy"><Copy className="h-4 w-4" /></button>
                </div>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {selected ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50">
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-tint text-blue"><Building2 className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-bold text-navy">{selected.company}</h2>
                  <p className="text-sm text-muted">{selected.contact} · {selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md p-2 text-muted hover:bg-surface"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-6 p-5">
              <Card className="p-5">
                <h3 className="font-bold text-navy">Client Info</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Text label="Company" value={selected.company} onChange={(value) => setSelected({ ...selected, company: value })} />
                  <Text label="Country" value={selected.country} onChange={(value) => setSelected({ ...selected, country: value })} />
                  <Text label="Contact" value={selected.contact} onChange={(value) => setSelected({ ...selected, contact: value })} />
                  <Text label="Email" value={selected.email} onChange={(value) => setSelected({ ...selected, email: value })} />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-surface p-4">
                  <span className="text-sm font-semibold text-navy">Status</span>
                  {clientStatusBadge(selected.status)}
                </div>
                <button onClick={() => saveClient.mutate()} className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><Save className="h-4 w-4" /> Edit Client</button>
              </Card>

              <Card>
                <SectionHeader title="Project History" />
                <div className="divide-y divide-border">
                  {selected.projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-bold text-navy">{project.title}</p>
                        <p className="text-sm text-muted">{project.status}</p>
                      </div>
                      <span className="font-bold text-navy">{usd(project.budget)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-bold text-navy">Payment Summary</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <Metric label="Total" value={usd(selected.payments.total)} />
                  <Metric label="Outstanding" value={usd(selected.payments.outstanding)} />
                  <Metric label="Last Invoice" value={selected.payments.lastInvoice} />
                </div>
              </Card>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}

const Text = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <label className="text-sm font-semibold text-navy">
    {label}
    <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal" />
  </label>
)

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-surface p-4">
    <p className="text-xs font-bold uppercase text-muted">{label}</p>
    <p className="mt-2 font-bold text-navy">{value}</p>
  </div>
)
