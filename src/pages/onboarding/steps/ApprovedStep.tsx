import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Card, SkillTag } from '../../../design-system/components'

const jobs = [
  { title: 'React dashboard cleanup', rate: 'Rs 900/hr', skills: ['React', 'Tailwind'] },
  { title: 'Frontend QA pass', rate: 'Rs 650/hr', skills: ['UI', 'Testing'] },
]

export const ApprovedStep = () => (
  <div className="flex min-h-[560px] flex-col justify-between">
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success-tint text-success">
        <CheckCircle2 className="h-11 w-11" />
      </div>
      <div>
        <h1 className="text-page-title text-primary-800">You&apos;re in!</h1>
        <p className="mt-2 text-body text-neutral-600">Your worker profile is approved. Browse jobs that match your skills.</p>
      </div>
      <Badge variant="success" className="px-3 py-1">Certified React Developer</Badge>
      <div className="space-y-3 text-left">
        {jobs.map((job) => (
          <Card key={job.title} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-body font-bold text-primary-800">{job.title}</h2>
                <p className="mt-1 text-caption font-mono text-neutral-600">{job.rate}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {job.skills.map((skill) => <SkillTag key={skill}>{skill}</SkillTag>)}
            </div>
          </Card>
        ))}
      </div>
    </div>
    <Link
      to="/w/jobs"
      className="mt-6 inline-flex h-[42px] w-full items-center justify-center rounded-sm bg-primary-600 px-4 text-body font-semibold text-white shadow-sm transition hover:bg-primary-800"
    >
      Browse all jobs
    </Link>
  </div>
)
