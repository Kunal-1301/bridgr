import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users } from 'lucide-react'
import { useAvailableJobs } from '../../hooks/api'
import { Card, ProgressBar, SkeletonBlock, WorkerPageTitle, money, relativeDate } from './workerUtils'

export const WorkerJobsPage = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [paymentType, setPaymentType] = useState('All')
  const [sort, setSort] = useState('Newest')
  const [skills, setSkills] = useState<string[]>([])
  const params = { page, search, payment_type: paymentType, sort, skills }
  const jobs = useAvailableJobs(params)
  const allSkills = useMemo(() => Array.from(new Set((jobs.data?.jobs || []).flatMap((job) => job.skills))), [jobs.data?.jobs])

  const toggleSkill = (skill: string) => setSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill])

  return (
    <div className="space-y-6">
      <WorkerPageTitle title="Browse Jobs" subtitle="Admin-rewritten worker scopes only. Client names, original budgets, and contact details are never shown." />
      <Card className="sticky top-0 z-10 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1.3fr_.8fr_.8fr]">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search job title" className="w-full rounded-md border border-border py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue" />
          </label>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((skill) => (
              <button key={skill} onClick={() => toggleSkill(skill)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${skills.includes(skill) ? 'border-amber bg-amber-tint text-amber' : 'border-border text-muted'}`}>{skill}</button>
            ))}
          </div>
          <select value={paymentType} onChange={(event) => setPaymentType(event.target.value)} className="rounded-md border border-border px-3 py-2 text-sm">
            {['All', 'Fixed', 'Milestone', 'Hourly'].map((value) => <option key={value}>{value}</option>)}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-md border border-border px-3 py-2 text-sm">
            {['Newest', 'Highest Pay', 'Deadline'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
      </Card>

      {jobs.isLoading ? <div className="grid gap-5 lg:grid-cols-2"><SkeletonBlock className="h-56" /><SkeletonBlock className="h-56" /></div> : (
        <div className="grid gap-5 lg:grid-cols-2">
          {jobs.data?.jobs.map((job) => (
            <Card key={job.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-bold text-navy">{job.title}</h2>
                <span className="rounded-full bg-blue-tint px-3 py-1 text-xs font-bold text-blue">{job.paymentType}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.skills.map((skill) => <span key={skill} className="rounded-full bg-amber-tint px-2.5 py-1 text-xs font-bold text-amber">{skill}</span>)}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-muted">Budget</p><p className="font-bold text-navy">{money(job.budget)}</p></div>
                <div><p className="text-xs text-muted">Team</p><p className="flex items-center gap-1 font-bold text-navy"><Users className="h-4 w-4" /> {job.teamSize}</p></div>
                <div><p className="text-xs text-muted">Deadline</p><p className="font-bold text-navy">{relativeDate(job.deadline)}</p></div>
              </div>
              <div className="mt-5"><ProgressBar value={65} tone="bg-amber" /></div>
              <Link to={`/w/jobs/${job.id}`} className="mt-5 inline-flex rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600">View & Apply</Link>
            </Card>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">Showing up to 20 jobs per page · Total {jobs.data?.total || 0}</p>
        <div className="flex gap-2">
          <button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-md border border-border bg-white px-3 py-2 text-xs font-bold disabled:opacity-40">Prev</button>
          <button onClick={() => setPage((value) => value + 1)} className="rounded-md border border-border bg-white px-3 py-2 text-xs font-bold">Next</button>
        </div>
      </div>
    </div>
  )
}
