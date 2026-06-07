import { useMemo, useState } from 'react'
import { z } from 'zod'
import { registerWorker } from '../../api/auth'
import { MobileShell } from '../../design-system/components'
import { OnboardingFooter } from './components/OnboardingFooter'
import { OnboardingHeader } from './components/OnboardingHeader'
import { OnboardingProgress } from './components/OnboardingProgress'
import { ApprovedStep } from './steps/ApprovedStep'
import { CreateAccountStep } from './steps/CreateAccountStep'
import { IdentityStep } from './steps/IdentityStep'
import { PendingVerificationStep } from './steps/PendingVerificationStep'
import { PortfolioStep } from './steps/PortfolioStep'
import { ProfileStep } from './steps/ProfileStep'
import { ResumeStep } from './steps/ResumeStep'
import { ReviewSubmitStep } from './steps/ReviewSubmitStep'
import { SkillTestStep } from './steps/SkillTestStep'

export type PortfolioEntry = { url: string; file: File | null }
export type OnboardingDraft = {
  fullName: string
  email: string
  phone: string
  city: string
  password: string
  dateOfBirth: string
  skills: string[]
  experienceLevel: 'Beginner' | 'Intermediate' | 'Expert' | ''
  rateMin: string
  rateMax: string
  bio: string
  resume: File | null
  portfolio: PortfolioEntry[]
  idType: string
  idFront: File | null
  skillTestStarted: boolean
}

export type OnboardingErrors = Partial<Record<keyof OnboardingDraft | 'submit' | 'portfolioUrl', string>>

const initialDraft: OnboardingDraft = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  password: '',
  dateOfBirth: '',
  skills: [],
  experienceLevel: '',
  rateMin: '',
  rateMax: '',
  bio: '',
  resume: null,
  portfolio: [{ url: '', file: null }],
  idType: '',
  idFront: null,
  skillTestStarted: false,
}

const steps = [
  'Account',
  'Profile',
  'Resume',
  'Work',
  'Identity',
  'Test',
  'Review',
] as const

const maxUploadSize = 10 * 1024 * 1024
const resumeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const identityTypes = ['application/pdf', 'image/jpeg', 'image/png']

const isAdult = (value: string) => {
  if (!value) return false
  const birthDate = new Date(value)
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return birthDate <= cutoff
}

const accountSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(8, 'Enter your phone number'),
  city: z.string().min(2, 'Enter your city'),
  password: z.string().min(8, 'Use at least 8 characters'),
  dateOfBirth: z.string().refine(isAdult, 'You must be at least 18'),
})

const profileSchema = z.object({
  skills: z.array(z.string()).min(1, 'Choose at least one skill'),
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Expert'], { message: 'Choose your experience level' }),
  rateMin: z.coerce.number().positive('Enter a minimum rate'),
  rateMax: z.coerce.number().positive('Enter a maximum rate'),
  bio: z.string().min(20, 'Write at least 20 characters').max(500, 'Keep it under 500 characters'),
}).refine((value) => Number(value.rateMax) >= Number(value.rateMin), {
  path: ['rateMax'],
  message: 'Max rate must be greater than min rate',
})

const fileSchema = (types: string[]) =>
  z.instanceof(File, { message: 'Upload a file' })
    .refine((file) => file.size <= maxUploadSize, 'Max file size is 10MB')
    .refine((file) => types.includes(file.type), 'Unsupported file type')

const resumeSchema = z.object({ resume: fileSchema(resumeTypes) })
const identitySchema = z.object({
  idType: z.string().min(1, 'Choose an ID type'),
  idFront: fileSchema(identityTypes),
})

const issueMap = (error: z.ZodError): OnboardingErrors =>
  error.issues.reduce<OnboardingErrors>((acc, issue) => {
    acc[String(issue.path[0]) as keyof OnboardingErrors] = issue.message
    return acc
  }, {})

export const WorkerOnboardingPage = () => {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<OnboardingDraft>(initialDraft)
  const [errors, setErrors] = useState<OnboardingErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateDraft = <K extends keyof OnboardingDraft>(field: K, value: OnboardingDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }))
  }

  const completed = useMemo(
    () => ({
      account: Boolean(draft.fullName && draft.email && draft.phone && draft.city && draft.password && draft.dateOfBirth),
      profile: Boolean(draft.skills.length && draft.experienceLevel && draft.rateMin && draft.rateMax && draft.bio),
      resume: Boolean(draft.resume),
      portfolio: draft.portfolio.some((entry) => entry.url || entry.file),
      identity: Boolean(draft.idType && draft.idFront),
      test: draft.skillTestStarted,
    }),
    [draft]
  )

  const validateCurrent = () => {
    const validators = [
      () => accountSchema.safeParse(draft),
      () => profileSchema.safeParse(draft),
      () => resumeSchema.safeParse({ resume: draft.resume }),
      () => ({ success: true as const }),
      () => identitySchema.safeParse({ idType: draft.idType, idFront: draft.idFront }),
      () => ({ success: true as const }),
      () => ({ success: true as const }),
    ]
    const result = validators[step]?.()
    if (!result || result.success) {
      setErrors({})
      return true
    }
    setErrors(issueMap((result as { success: false; error: Parameters<typeof issueMap>[0] }).error))
    return false
  }

  const submit = async () => {
    setIsSubmitting(true)
    setErrors({})
    try {
      await registerWorker({
        fullName: draft.fullName,
        email: draft.email,
        password: draft.password,
        phone: draft.phone,
        city: draft.city,
        dateOfBirth: draft.dateOfBirth,
        bio: draft.bio,
        skills: draft.skills,
        experienceLevel: draft.experienceLevel,
        rateMin: Number(draft.rateMin),
        rateMax: Number(draft.rateMax),
        portfolioLinks: draft.portfolio.map((entry) => entry.url).filter(Boolean),
      })
      setStep(7)
    } catch {
      setErrors({ submit: 'We could not submit your application. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const next = async () => {
    if (!validateCurrent()) return
    if (step === 6) {
      await submit()
      return
    }
    setStep((current) => Math.min(current + 1, 8))
  }

  const back = () => setStep((current) => Math.max(current - 1, 0))

  const stepView = [
    <CreateAccountStep draft={draft} errors={errors} updateDraft={updateDraft} />,
    <ProfileStep draft={draft} errors={errors} updateDraft={updateDraft} />,
    <ResumeStep draft={draft} errors={errors} updateDraft={updateDraft} />,
    <PortfolioStep draft={draft} errors={errors} updateDraft={updateDraft} />,
    <IdentityStep draft={draft} errors={errors} updateDraft={updateDraft} />,
    <SkillTestStep draft={draft} updateDraft={updateDraft} />,
    <ReviewSubmitStep draft={draft} completed={completed} errors={errors} goToStep={setStep} />,
    <PendingVerificationStep onEdit={() => setStep(1)} onApprovedPreview={() => setStep(8)} />,
    <ApprovedStep />,
  ][step]

  return (
    <div className="min-h-screen bg-primary-800 px-4 py-6 sm:py-10">
      <MobileShell
        framed
        header={<OnboardingHeader eyebrow={step < 7 ? `Step ${step + 1} of 7` : 'Application status'} title={step < 7 ? steps[step] : step === 7 ? 'Review' : 'Approved'} />}
        className="min-h-[760px]"
      >
        {step < 7 && <OnboardingProgress value={step + 1} total={7} />}
        <div className="mt-5">{stepView}</div>
      </MobileShell>
      {step < 7 && (
        <div className="mx-auto max-w-[390px]">
          <OnboardingFooter
            canGoBack={step > 0}
            primaryLabel={step === 6 ? 'Submit for review' : 'Continue'}
            loading={isSubmitting}
            onBack={back}
            onNext={next}
          />
        </div>
      )}
    </div>
  )
}
