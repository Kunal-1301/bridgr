import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { Archive, Download, File, Lock, Megaphone, MoreVertical, Paperclip, Pin, Plus, Save, Send, Trash2, UserPlus } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/toastStore'
import {
  adminKeys,
  createAdminTask,
  getAdminProject,
  getAdminProjectMessages,
  getAdminProjectTasks,
  sendAdminWorkspaceMessage,
  updateAdminProject,
  type AdminTask,
  type AdminTaskStatus,
} from '../../api/admin'
import { Card, SkeletonBlock, dateShort, usd } from './adminUtils'

const taskStatuses: AdminTaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done']

export const AdminProjectWorkspacePage = () => {
  const { id = '' } = useParams()
  const [channel, setChannel] = useState('general')
  const [panel, setPanel] = useState<'tasks' | 'files' | 'team'>('tasks')
  const [tasks, setTasks] = useState<AdminTask[]>([])
  const [notes, setNotes] = useState('')
  const [clientUpdate, setClientUpdate] = useState('')
  const [message, setMessage] = useState('')
  const [newTask, setNewTask] = useState('')
  const { notify } = useToast()
  const project = useQuery({ queryKey: adminKeys.project(id), queryFn: () => getAdminProject(id) })
  const messages = useQuery({ queryKey: adminKeys.projectMessages(id), queryFn: () => getAdminProjectMessages(id), refetchInterval: 15000 })
  const taskQuery = useQuery({ queryKey: adminKeys.projectTasks(id), queryFn: () => getAdminProjectTasks(id) })
  const update = useMutation({ mutationFn: (payload: unknown) => updateAdminProject(id, payload), onSuccess: () => notify({ kind: 'success', title: 'Project updated' }) })
  const send = useMutation({
    mutationFn: () => sendAdminWorkspaceMessage(id, { content: message, channelId: null }),
    onSuccess: () => {
      notify({ kind: 'success', title: 'Admin message sent' })
      setMessage('')
    },
  })
  const addTask = useMutation({
    mutationFn: () => createAdminTask(id, { title: newTask, status: 'To Do' }),
    onSuccess: () => {
      setTasks((current) => [...current, { id: crypto.randomUUID(), title: newTask, status: 'To Do', assignee: 'AD', dueDate: new Date().toISOString() }])
      setNewTask('')
      notify({ kind: 'success', title: 'Task created' })
    },
  })

  useEffect(() => {
    if (taskQuery.data) setTasks(taskQuery.data)
  }, [taskQuery.data])

  useEffect(() => {
    if (project.data) setNotes(project.data.privateNotes)
  }, [project.data?.id])

  const files = useMemo(() => [...(project.data?.files || []), ...(messages.data?.flatMap((item) => item.attachments || []) || [])], [project.data?.files, messages.data])

  const onDragEnd = (event: DragEndEvent) => {
    const taskId = String(event.active.id)
    const targetStatus = event.over?.id ? String(event.over.id) as AdminTaskStatus : undefined
    if (!targetStatus) return
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status: targetStatus } : task))
  }

  if (project.isLoading) return <SkeletonBlock className="h-[680px]" />

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">{project.data?.title}</h1>
          <p className="mt-1 text-sm text-muted">Client: {project.data?.client} · Admin nerve center</p>
        </div>
        <WorkspaceActions onAction={(action) => update.mutate({ action })} />
      </div>

      <div className="grid min-h-[calc(100vh-11rem)] gap-4 xl:grid-cols-[240px_1fr_310px]">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-bold text-navy">Channels</h2>
            <button onClick={() => notify({ kind: 'info', title: 'Channel added' })} className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" /> Add Channel</button>
          </div>
          <nav className="space-y-1 p-3">
            {project.data?.channels.map((name) => (
              <button key={name} onClick={() => setChannel(name)} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold ${channel === name ? 'bg-blue text-white' : 'text-muted hover:bg-surface'}`}>
                {name === 'Admin Announcements' ? <Lock className="h-4 w-4" /> : <span>#</span>}
                {name}
              </button>
            ))}
          </nav>
        </Card>

        <Card className="flex min-h-[680px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-bold text-navy">#{channel}</h2>
            <Badge variant="info">Admin view</Badge>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-surface p-5">
            {messages.data?.map((item) => (
              <div key={item.id} className="flex gap-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${item.senderRole === 'Admin' ? 'bg-navy text-white' : 'bg-blue-tint text-blue'}`}>{item.senderInitials}</span>
                <div className="max-w-2xl rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-navy">{item.senderName}</span>
                    {item.senderRole === 'Admin' ? <Badge variant="info">Admin</Badge> : null}
                    {item.pinned ? <span className="inline-flex items-center gap-1 text-amber"><Pin className="h-3 w-3" /> pinned</span> : null}
                    <span className="text-muted">{dateShort(item.timestamp)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink">{item.body}</p>
                  {item.attachments?.map((attachment: { name: string; size: string }) => <button key={attachment.name} className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-blue"><File className="h-4 w-4" /> {attachment.name} · {attachment.size}</button>)}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border bg-white p-4">
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <button><Paperclip className="h-4 w-4 text-muted" /></button>
              <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Post as admin..." className="flex-1 text-sm outline-none" />
              <button onClick={() => send.mutate()} disabled={!message.trim()} className="rounded-md bg-blue p-2 text-white disabled:opacity-50"><Send className="h-4 w-4" /></button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-3 border-b border-border text-xs font-bold">
            {(['tasks', 'files', 'team'] as const).map((tab) => <button key={tab} onClick={() => setPanel(tab)} className={`py-3 capitalize ${panel === tab ? 'bg-blue text-white' : 'text-muted'}`}>{tab}</button>)}
          </div>
          {panel === 'tasks' ? (
            <DndContext onDragEnd={onDragEnd}>
              <div className="space-y-3 p-3">
                <div className="flex gap-2">
                  <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Create task" className="min-w-0 flex-1 rounded-md border border-border px-3 py-2 text-sm" />
                  <button onClick={() => addTask.mutate()} disabled={!newTask.trim()} className="rounded-md bg-blue px-3 text-white disabled:opacity-50"><Plus className="h-4 w-4" /></button>
                </div>
                {taskStatuses.map((status) => <TaskColumn key={status} status={status} tasks={tasks.filter((task) => task.status === status)} onDelete={(taskId) => setTasks((current) => current.filter((task) => task.id !== taskId))} />)}
              </div>
            </DndContext>
          ) : null}
          {panel === 'files' ? <div className="space-y-2 p-4">{files.map((file) => <div key={file.name} className="rounded-md bg-surface p-3 text-sm font-semibold text-navy">{file.name}<p className="text-xs text-muted">{file.size}</p></div>)}</div> : null}
          {panel === 'team' ? <div className="space-y-3 p-4">{project.data?.workers.map((member) => <div key={member.id} className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-tint text-xs font-bold text-blue">{member.initials}</span><div><p className="text-sm font-bold text-navy">{member.name}</p><p className="text-xs text-muted">{member.role}</p></div></div>{member.online ? <Badge variant="active">Online</Badge> : <Badge variant="suspended">Offline</Badge>}</div>)}<button className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-navy"><UserPlus className="h-4 w-4" /> Add worker</button></div> : null}
        </Card>
      </div>

      <Card>
        <details open>
          <summary className="cursor-pointer border-b border-border p-5 text-lg font-bold text-navy">Admin-only panel</summary>
          <div className="grid gap-5 p-5 xl:grid-cols-4">
            <AdminPanelBlock title="Private Admin Notes">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-32 w-full rounded-md border border-border px-3 py-2 text-sm" />
              <button onClick={() => update.mutate({ privateNotes: notes })} className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white"><Save className="h-4 w-4" /> Save</button>
            </AdminPanelBlock>
            <AdminPanelBlock title="Client Update Composer">
              <textarea value={clientUpdate} onChange={(e) => setClientUpdate(e.target.value)} placeholder="Write update for client portal..." className="min-h-32 w-full rounded-md border border-border px-3 py-2 text-sm" />
              <button onClick={() => { update.mutate({ clientUpdate }); setClientUpdate('') }} className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber px-3 py-2 text-xs font-bold text-navy"><Megaphone className="h-4 w-4" /> Publish</button>
            </AdminPanelBlock>
            <AdminPanelBlock title="Milestone Manager">
              <div className="space-y-2">{project.data?.milestones.map((milestone) => <div key={milestone.id} className="rounded-md bg-surface p-3"><p className="font-bold text-navy">{milestone.title}</p><p className="text-xs text-muted">{usd(milestone.amount)} · {milestone.status}</p><button className="mt-2 rounded-md bg-success px-2 py-1 text-xs font-bold text-white">Release Payment</button></div>)}</div>
            </AdminPanelBlock>
            <AdminPanelBlock title="Team Manager">
              <div className="space-y-2">{project.data?.workers.map((member) => <div key={member.id} className="flex items-center justify-between rounded-md bg-surface p-3 text-sm"><span className="font-bold text-navy">{member.name}</span><button className="text-error"><Trash2 className="h-4 w-4" /></button></div>)}</div>
            </AdminPanelBlock>
          </div>
        </details>
      </Card>
    </div>
  )
}

const WorkspaceActions = ({ onAction }: { onAction: (action: string) => void }) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <button className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-bold text-navy"><MoreVertical className="h-4 w-4" /> Workspace Actions</button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content align="end" className="z-50 min-w-48 rounded-lg border border-border bg-white p-1.5 shadow-lg">
        <DropdownMenu.Item onClick={() => onAction('complete')} className="cursor-pointer rounded-md px-3 py-2 text-sm font-semibold text-navy hover:bg-surface">Mark Complete</DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => onAction('export-chat')} className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-navy hover:bg-surface"><Download className="h-4 w-4" /> Export Chat Log</DropdownMenu.Item>
        <DropdownMenu.Item onClick={() => onAction('archive')} className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-error hover:bg-error-tint"><Archive className="h-4 w-4" /> Archive Project</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
)

const TaskCard = ({ task, onDelete }: { task: AdminTask; onDelete: () => void }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <div ref={setNodeRef} style={style} className="rounded-md border border-border bg-white p-3 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p {...listeners} {...attributes} className="cursor-grab font-bold text-navy active:cursor-grabbing">{task.title}</p>
        <button onClick={onDelete} className="text-error" title="Delete task"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      <p className="mt-2 text-xs text-muted">{task.assignee} · {dateShort(task.dueDate)}</p>
    </div>
  )
}

const TaskColumn = ({ status, tasks, onDelete }: { status: AdminTaskStatus; tasks: AdminTask[]; onDelete: (id: string) => void }) => {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div ref={setNodeRef} className={`rounded-lg p-3 transition ${isOver ? 'bg-blue-tint' : 'bg-surface'}`}>
      <h3 className="text-xs font-bold uppercase text-muted">{status}</h3>
      <div className="mt-2 space-y-2">{tasks.map((task) => <TaskCard key={task.id} task={task} onDelete={() => onDelete(task.id)} />)}</div>
    </div>
  )
}

const AdminPanelBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-lg border border-border p-4">
    <h3 className="font-bold text-navy">{title}</h3>
    <div className="mt-3">{children}</div>
  </div>
)
