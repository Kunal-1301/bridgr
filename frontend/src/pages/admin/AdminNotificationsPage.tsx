import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { adminKeys, getAdminNotifications } from '../../api/admin'
import { Card, SectionHeader, dateShort } from './adminUtils'

export const AdminNotificationsPage = () => {
  const notifications = useQuery({ queryKey: adminKeys.notifications(), queryFn: getAdminNotifications })
  const [mode, setMode] = useState('specific')
  return <div className="space-y-6"><PageHeader title="Notifications Center" subtitle="Compose targeted messages, broadcasts, and review delivery history." /><Card><SectionHeader title="Custom Composer" /><div className="space-y-4 p-5"><select value={mode} onChange={(e) => setMode(e.target.value)} className="rounded-md border border-border px-3 py-2 text-sm"><option value="specific">Specific users</option><option value="workers">All workers</option><option value="clients">All clients</option><option value="all">Broadcast to all</option></select><input placeholder="Recipients or role group" className="w-full rounded-md border border-border px-3 py-2 text-sm" /><input placeholder="Notification title" className="w-full rounded-md border border-border px-3 py-2 text-sm" /><textarea placeholder="Message body" className="min-h-32 w-full rounded-md border border-border px-3 py-2 text-sm" /><button className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><Send className="h-4 w-4" /> Send Notification</button></div></Card><Card><SectionHeader title="Notification History" /><div className="divide-y divide-border">{notifications.data?.history.map((item) => <div key={item.id} className="grid gap-2 p-4 md:grid-cols-5"><strong className="text-navy">{item.title}</strong><span>{item.audience}</span><span>{dateShort(item.sentAt)}</span><span>{item.delivered} delivered</span><span>{item.opened} opened</span></div>)}</div></Card></div>
}
