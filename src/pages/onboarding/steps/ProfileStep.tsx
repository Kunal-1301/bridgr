import { X } from 'lucide-react'
import { Button, Input, SkillTag, Textarea } from '../../../design-system/components'
import { cn } from '../../../design-system/cn'
import { OnboardingField } from '../components/OnboardingField'
import type { OnboardingDraft, OnboardingErrors } from '../WorkerOnboardingPage'

const skills = ['React', 'Node.js', 'Python', 'UI Design', 'Writing', 'SEO', 'Figma', 'Data Entry', 'WordPress']
const levels = ['Beginner', 'Intermediate', 'Expert'] as const

interface StepProps {
  draft: OnboardingDraft
  errors: OnboardingErrors
  updateDraft: <K extends keyof OnboardingDraft>(field: K, value: OnboardingDraft[K]) => void
}

export const ProfileStep = ({ draft, errors, updateDraft }: StepProps) => {
  const toggleSkill = (skill: string) => {
    updateDraft('skills', draft.skills.includes(skill) ? draft.skills.filter((item) => item !== skill) : [...draft.skills, skill])
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-page-title text-primary-800">Set your profile</h1>
        <p className="mt-2 text-body text-neutral-600">Help Bridgr match you to the right work.</p>
      </div>
      <OnboardingField label="Skills" error={errors.skills}>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <button key={skill} type="button" onClick={() => toggleSkill(skill)}>
              <SkillTag className={cn(draft.skills.includes(skill) && 'border-primary-600 bg-primary-50 text-primary-800')}>
                {skill}
                {draft.skills.includes(skill) && <X className="ml-1 h-3 w-3" />}
              </SkillTag>
            </button>
          ))}
        </div>
      </OnboardingField>
      <OnboardingField label="Experience level" error={errors.experienceLevel}>
        <div className="grid grid-cols-3 gap-2">
          {levels.map((level) => (
            <Button
              key={level}
              variant={draft.experienceLevel === level ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => updateDraft('experienceLevel', level)}
            >
              {level}
            </Button>
          ))}
        </div>
      </OnboardingField>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Min/hour" type="number" value={draft.rateMin} error={errors.rateMin} onChange={(event) => updateDraft('rateMin', event.target.value)} />
        <Input label="Max/hour" type="number" value={draft.rateMax} error={errors.rateMax} onChange={(event) => updateDraft('rateMax', event.target.value)} />
      </div>
      <Textarea label="Short bio" value={draft.bio} error={errors.bio} maxLength={500} onChange={(event) => updateDraft('bio', event.target.value)} />
    </div>
  )
}
