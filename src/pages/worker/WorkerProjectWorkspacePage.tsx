import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { Download, File, Lock, Paperclip, Send, Smile } from 'lucide-react'
import { apiClient } from '../../api/client'
import { getProject, getProjectChannels, getProjectMessages, getProjectTasks, type Task, type TaskStatus, workerKeys } from '../../api/worker'
import { Card, Initials, SkeletonBlock, dateShort, statusBadge } from './workerUtils'

const statuses: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done']

const TaskCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="cursor-grab rounded-md border border-border bg-white p-3 text-sm shadow-sm active:cursor-grabbing">
      <p className="font-bold text-navy">{task.title}</p>
      <p className="mt-2 text-xs text-muted">{task.assigneeInitials} · {dateShort(task.dueDate)}</p>
    </div>
  )
}

const TaskColumn = ({ status, tasks }: { status: TaskStatus; tasks: Task[] }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef} className={`rounded-lg p-3 transition ${isOver ? 'bg-blue-tint' : 'bg-surface'}`}>
      <h3 className="text-xs font-bold uppercase text-muted">{status}</h3>
      <div className="mt-2 space-y-2">
        {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
      </div>
    </div>
  )
}

export const WorkerProjectWorkspacePage = () => {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [channel, setChannel] = useState('general')
  const [tasks, setTasks] = useState<Task[]>([])
  const [panel, setPanel] = useState<'tasks' | 'files' | 'team'>('tasks')
  const [message, setMessage] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const project = useQuery({ queryKey: workerKeys.project(id), queryFn: () => getProject(id) })
  const channels = useQuery({ queryKey: workerKeys.channels(id), queryFn: () => getProjectChannels(id) })
  const messages = useQuery({
    queryKey: ['worker', 'project', id, 'messages'],
    queryFn: () => getProjectMessages(id),
    refetchInterval: 15000,
  })
  const taskQuery = useQuery({ queryKey: workerKeys.tasks(id), queryFn: () => getProjectTasks(id) })

  const send = useMutation({
    mutationFn: () => apiClient.post(`/worker/projects/${id}/messages`, { content: message }).then((r) => r.data),
    onSuccess: () => {
      setMessage('')
      queryClient.invalidateQueries({ queryKey: ['worker', 'project', id, 'messages'] })
    },
  })

  useEffect(() => {
    if (taskQuery.data) setTasks(taskQuery.data)
  }, [taskQuery.data])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.data])

  const files = useMemo(() => messages.data?.flatMap((msg) => (msg as any).attachments || []) || [], [messages.data])

  const onDragEnd = (event: DragEndEvent) => {
    const taskId = String(event.active.id)
    const targetStatus = event.over?.id ? String(event.over.id) as TaskStatus : undefined
    if (!targetStatus) return
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: targetStatus } : task))
  }

  const msgItems: any[] = Array.isArray(messages.data)
    ? messages.data
    : (messages.data as any)?.items ?? []

  if (project.isLoading) return <SkeletonBlock className="h-[620px]" />

  return (
    <div className="grid min-h-[calc(100vh-9rem)] gap-4 xl:grid-cols-[240px_1fr_280px]">
      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="text-sm font-bold text-navy">{(project.data as any)?.title ?? 'Project'}</h2>
          <p className="mt-1 flex items-center gap-2 text-xs text-success"><span className="h-2 w-2 rounded-full bg-success" /> Live · updates every 15s</p>
        </div>
        <nav className="space-y-1 p-3">
          {(channels.data as any[] ?? []).map((name: string) => (
            <button key={name} onClick={() => setChannel(name)} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold ${channel === name ? 'bg-blue text-white' : 'text-muted hover:bg-surface'}`}>
              {name === 'Admin Announcements' ? <Lock className="h-4 w-4" /> : <span>#</span>}
              {name}
            </button>
          ))}
        </nav>
      </Card>

      <Card className="flex min-h-[620px] flex-col overflow-hidden">
        {(project.data as any)?.meetingLink ? (
          <a href={(project.data as any).meetingLink} className="bg-amber-tint px-5 py-3 text-sm font-bold text-amber">Admin meeting link posted: Join sync</a>
        ) : null}
        <div className="border-b border-border px-5 py-4">
          <h1 className="text-lg font-bold text-navy">#{channel}</h1>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto bg-surface p-5">
          {msgItems.map((msg: any) => (
            <div key={msg.id} className="flex gap-3">
              <Initials value={msg.senderInitials ?? msg.senderId?.slice(0, 2).toUpperCase() ?? '??'} />
              <div className="max-w-2xl rounded-lg bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-navy">
                  {msg.senderName ?? 'Member'}
                  <span className="font-medium text-muted"> · {dateShort(msg.timestamp ?? msg.createdAt)}</span>
                </p>
                <p className="mt-2 text-sm leading-6 text-ink">{msg.body ?? msg.content}</p>
                {msg.attachments?.map((att: any) => (
                  <button key={att.name} className="mt-3 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-blue">
                    <File className="h-4 w-4" /> {att.name} · {att.size} <Download className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-border bg-white p-4">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <button><Smile className="h-4 w-4 text-muted" /></button>
            <button><Paperclip className="h-4 w-4 text-muted" /></button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && message.trim()) { e.preventDefault(); send.mutate() } }}
              placeholder="Send a workspace message..."
              className="flex-1 text-sm outline-none"
            />
            <button
              onClick={() => send.mutate()}
              disabled={!message.trim() || send.isPending}
              className="rounded-md bg-blue p-2 text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">Messages refresh every 15 seconds.</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-3 border-b border-border text-xs font-bold">
          {(['tasks', 'files', 'team'] as const).map((tab) => <button key={tab} onClick={() => setPanel(tab)} className={`py-3 capitalize ${panel === tab ? 'bg-blue text-white' : 'text-muted'}`}>{tab}</button>)}
        </div>
        {panel === 'tasks' && (
          <DndContext onDragEnd={onDragEnd}>
            <div className="space-y-3 p-3">
              {statuses.map((status) => (
                <TaskColumn key={status} status={status} tasks={tasks.filter((task) => task.status === status)} />
              ))}
            </div>
          </DndContext>
        )}
        {panel === 'files' && <div className="space-y-2 p-4">{files.map((file: any) => <div key={file.name} className="rounded-md bg-surface p-3 text-sm font-semibold text-navy">{file.name}<p className="text-xs text-muted">{file.size}</p></div>)}</div>}
        {panel === 'team' && (
          <div className="space-y-3 p-4">
            {(project.data as any)?.team?.map((member: any) => (
              <div key={member.initials} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Initials value={member.initials} />
                  <div>
                    <p className="text-sm font-bold text-navy">{member.initials}</p>
                    <p className="text-xs text-muted">{member.role}</p>
                  </div>
                </div>
                {member.online ? statusBadge('Active') : statusBadge('Offline')}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
