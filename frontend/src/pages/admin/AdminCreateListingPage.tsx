import { useState } from 'react'
import { AlertCircle, CheckCircle2, Save } from 'lucide-react'
import { MarginCalculator } from '../../components/admin/MarginCalculator'
import { Button, Card, Input, Select, SkillTag, Textarea } from '../../design-system/components'

const sourceJob = {
  id: 'CJ-1042',
  title: 'Client dashboard modernization',
  clientPaysCap: 300,
  deadline: '2026-08-30',
}

export const AdminCreateListingPage = () => {
  const [title, setTitle] = useState('Senior React dashboard build')
  const [description, setDescription] = useState('Build and refine dashboard screens, component states, and implementation-ready UI with manager-reviewed delivery checkpoints.')
  const [skills, setSkills] = useState(['React', 'TypeScript', 'Dashboard UI'])
  const [visibility, setVisibility] = useState('Skills-filtered')
  const [tier, setTier] = useState('Certified')
  const [deadline, setDeadline] = useState(sourceJob.deadline)
  const [workerBudget, setWorkerBudget] = useState(200)
  const [margin, setMargin] = useState(33)

  const toggleSkill = (skill: string) => {
    setSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill])
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-page-title text-primary-800">Create listing</h1>
        <p className="mt-1 text-body text-neutral-600">From client job #{sourceJob.id} - client details hidden</p>
      </div>

      <Card className="flex items-start gap-3 border-warning/20 bg-warning-tint p-4 text-warning">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-body font-semibold">Worker-facing. Original client name, budget & contact are never shown.</p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="p-6">
          <div className="grid gap-5">
            <Input label="Listing title rewritten" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Textarea label="Description rewritten" value={description} onChange={(event) => setDescription(event.target.value)} />
            <div>
              <p className="mb-2 text-caption font-bold uppercase text-primary-800">Required skills</p>
              <div className="flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Dashboard UI', 'QA', 'API'].map((skill) => (
                  <button key={skill} type="button" onClick={() => toggleSkill(skill)}>
                    <SkillTag className={skills.includes(skill) ? 'border-primary-600 bg-primary-50 text-primary-800' : ''}>{skill}</SkillTag>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <Select label="Visibility" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                <option>Open</option>
                <option>Skills-filtered</option>
                <option>Invite-only</option>
              </Select>
              <Select label="Min tier to apply" value={tier} onChange={(event) => setTier(event.target.value)}>
                <option>Verified</option>
                <option>Certified</option>
                <option>Pro</option>
                <option>Elite</option>
              </Select>
              <Input label="Deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </div>
            <Card className="bg-neutral-50 p-4">
              <p className="text-caption font-bold uppercase text-neutral-600">Worker-facing preview</p>
              <h2 className="mt-2 text-section text-primary-800">{title}</h2>
              <p className="mt-2 text-body text-neutral-600">{description}</p>
              <p className="mt-3 font-mono text-body font-bold text-primary-800">${workerBudget}/hr cap</p>
            </Card>
          </div>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <MarginCalculator
            initialClientBudget={sourceJob.clientPaysCap}
            initialMargin={margin}
            onApply={(budget, nextMargin) => {
              setWorkerBudget(budget)
              setMargin(nextMargin)
            }}
          />
          <Card className="p-5">
            <div className="space-y-3 text-body">
              <Row label="Client pays private" value="$300/hr cap" />
              <Row label="Margin slider" value={`${margin}%`} />
              <Row label="Worker budget shown" value={`$${workerBudget}/hr cap`} />
              <Row label="You keep" value={`$${sourceJob.clientPaysCap - workerBudget}/hr`} />
            </div>
            <div className="mt-5 flex gap-3">
              <Button className="flex-1" iconLeft={<CheckCircle2 className="h-4 w-4" />}>Publish listing</Button>
              <Button className="flex-1" variant="secondary" iconLeft={<Save className="h-4 w-4" />}>Save as draft</Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3 rounded-lg bg-neutral-50 p-3">
    <span className="font-semibold text-neutral-600">{label}</span>
    <span className="font-mono font-bold text-primary-800">{value}</span>
  </div>
)
