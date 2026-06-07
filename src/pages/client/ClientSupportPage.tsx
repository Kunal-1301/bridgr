import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Send, Upload } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { clientKeys, createSupportTicket, getSupportTickets, replyToTicket, type SupportTicket } from '../../api/clientPortal'
import { useToast } from '../../components/ui/toastStore'
import { Card, SectionHeader, SkeletonBlock, clientStatusBadge, dateShort } from './clientUtils'

const categories = ['Payment Issue', 'Technical', 'Account', 'General']

export const ClientSupportPage = () => {
  const tickets = useQuery({ queryKey: clientKeys.tickets(), queryFn: getSupportTickets })
  const [selected, setSelected] = useState<SupportTicket | null>(null)
  const [form, setForm] = useState({ category: 'General', subject: '', description: '' })
  const [reply, setReply] = useState('')
  const { notify } = useToast()
  const createTicket = useMutation({
    mutationFn: () => createSupportTicket(form),
    onSuccess: () => {
      notify({ kind: 'success', title: 'Ticket submitted', message: 'The Bridgr admin team will respond in this thread.' })
      setForm({ category: 'General', subject: '', description: '' })
    },
  })
  const sendReply = useMutation({
    mutationFn: () => replyToTicket(selected?.id || '', reply),
    onSuccess: () => {
      notify({ kind: 'success', title: 'Reply sent' })
      setReply('')
    },
  })

  if (tickets.isLoading) return <SkeletonBlock />

  const canSubmit = form.subject.trim().length > 0 && form.description.trim().length >= 20

  return (
    <div className="space-y-6">
      <PageHeader title="Support" subtitle="Open a ticket or continue a client-admin support thread." />
      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <SectionHeader title="Raise a Ticket" subtitle="All communication is directly between your account and Bridgr admin." />
          <div className="space-y-4 p-5">
            <label className="text-sm font-semibold text-navy">
              Category
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-2 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal">
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-navy">
              Subject
              <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="mt-2 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal outline-none focus:border-blue focus:ring-1 focus:ring-blue" />
            </label>
            <label className="text-sm font-semibold text-navy">
              Description
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-36 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal outline-none focus:border-blue focus:ring-1 focus:ring-blue" />
              <span className="mt-1 block text-xs font-normal text-muted">Minimum 20 characters.</span>
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-surface px-4 py-4 text-sm font-bold text-muted">
              <Upload className="h-4 w-4" /> Optional attachment
              <input type="file" className="sr-only" />
            </label>
            <button disabled={!canSubmit} onClick={() => createTicket.mutate()} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
              <Send className="h-4 w-4" /> Submit Ticket
            </button>
          </div>
        </Card>

        <Card>
          <SectionHeader title="My Tickets" />
          <div className="grid min-h-[420px] md:grid-cols-[260px_1fr]">
            <div className="border-b border-border md:border-b-0 md:border-r">
              {(tickets.data || []).map((ticket) => (
                <button key={ticket.id} onClick={() => setSelected(ticket)} className={`w-full border-b border-border p-4 text-left hover:bg-surface ${selected?.id === ticket.id ? 'bg-blue-tint' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-bold text-navy">{ticket.subject}</p>
                    {clientStatusBadge(ticket.status)}
                  </div>
                  <p className="mt-2 text-xs text-muted">{ticket.category} · {dateShort(ticket.lastUpdated)}</p>
                </button>
              ))}
            </div>
            <div className="flex min-h-[420px] flex-col">
              {selected ? (
                <>
                  <div className="border-b border-border p-4">
                    <h3 className="font-bold text-navy">{selected.subject}</h3>
                    <p className="mt-1 text-xs text-muted">Client ↔ Bridgr admin thread</p>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    {selected.messages.map((message) => (
                      <div key={message.id} className={`max-w-[85%] rounded-lg p-4 ${message.sender === 'Client' ? 'ml-auto bg-blue text-white' : 'bg-surface text-ink'}`}>
                        <p className="text-xs font-bold">{message.sender === 'Client' ? 'You' : 'Bridgr Admin'}</p>
                        <p className="mt-2 text-sm leading-6">{message.body}</p>
                        <p className={`mt-2 text-xs ${message.sender === 'Client' ? 'text-white/75' : 'text-muted'}`}>{dateShort(message.timestamp)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border p-4">
                    <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to Bridgr admin..." className="min-h-24 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-blue focus:ring-1 focus:ring-blue" />
                    <button disabled={!reply.trim()} onClick={() => sendReply.mutate()} className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                      <Send className="h-4 w-4" /> Send Reply
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted">Select a ticket to view the admin thread.</div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
