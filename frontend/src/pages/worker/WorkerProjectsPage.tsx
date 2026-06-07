import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getProjects, workerKeys } from '../../api/worker'
import { Card, Initials, ProgressBar, SkeletonBlock, WorkerPageTitle, dateShort, statusBadge } from './workerUtils'

export const WorkerProjectsPage = () => {
  const projects = useQuery({ queryKey: workerKeys.projects(), queryFn: () => getProjects() })

  return (
    <div className="space-y-6">
      <WorkerPageTitle title="Active Projects" subtitle="Project workspaces include team members and admins only. Clients are never present here." />
      {projects.isLoading ? <div className="grid gap-5 lg:grid-cols-3"><SkeletonBlock className="h-64" /><SkeletonBlock className="h-64" /><SkeletonBlock className="h-64" /></div> : (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {projects.data?.map((project) => (
            <Card key={project.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-bold text-navy">{project.title}</h2>
                {statusBadge(project.status)}
              </div>
              <div className="mt-5 flex -space-x-2">
                {project.team.map((member) => <Initials key={`${project.id}-${member.initials}`} value={member.initials} className="ring-2 ring-white" />)}
              </div>
              <div className="mt-5 flex items-center justify-between text-xs text-muted">
                <span>Deadline {dateShort(project.deadline)}</span>
                <span>{project.progress}%</span>
              </div>
              <div className="mt-2"><ProgressBar value={project.progress} tone={project.status === 'Completed' ? 'bg-success' : 'bg-blue'} /></div>
              <Link to={`/w/projects/${project.id}`} className="mt-5 inline-flex w-full justify-center rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600">Open Workspace</Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
