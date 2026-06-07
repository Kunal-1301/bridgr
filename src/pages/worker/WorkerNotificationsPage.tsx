import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, Briefcase, CheckCheck, CreditCard, Settings } from 'lucide-react'
import { getNotifications, workerKeys } from '../../api/worker'
import { Card, SkeletonBlock, WorkerPageTitle, dateShort } from './workerUtils'

const filters = ['All', 'Unread', 'Jobs', 'Payments', 'System'] as const

export const WorkerNotificationsPage = () => {
  const [filter, setFilter] = useState<typeof filters[number]>('All')
  const [readIds, setReadIds] = useState<string[]>([])
  const notifications = useQuery({ queryKey: workerKeys.notifications(), queryFn: getNotifications })
  const rows = useMemo(() => {
    const data = notifications.data?.map((item) => ({ ...item, unread: item.unread && !readIds.includes(item.id) })) || []
    if (filter === 'All') return data
    if (filter === 'Unread') return data.filter((item) => item.unread)
    return data.filter((item) => item.type === filter)
  }, [notifications.data, filter, readIds])

  const icon = (type: string) => type === 'Jobs' ? <Briefcase className="h-4 w-4" /> : type === 'Payments' ? <CreditCard className="h-4 w-4" /> : <Settings className="h-4 w-4" />

  return (
    <div className="space-y-6">
      <WorkerPageTitle title="Notifications" subtitle="Review job, payment, and system updates." action={<button onClick={() => setReadIds(notifications.data?.map((item) => item.id) || [])} className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><CheckCheck className="h-4 w-4" /> Mark all as read</button>} />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          {filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-3 py-2 text-xs font-bold ${filter === item ? 'bg-blue text-white' : 'bg-surface text-muted'}`}>{item}</button>)}
        </div>
        {notifications.isLoading ? <SkeletonBlock className="m-5 h-48" /> : (
          <div className="divide-y divide-border">
            {rows.map((item) => (
              <div key={item.id} className={`flex gap-3 p-5 ${item.unread ? 'bg-blue-tint/40' : ''}`}>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-tint text-blue">{icon(item.type)}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy">{item.message}</p>
                  <p className="mt-1 text-xs text-muted">{item.type} · {dateShort(item.timestamp)}</p>
                </div>
                {item.unread ? <Bell className="h-4 w-4 text-blue" /> : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
