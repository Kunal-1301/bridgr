import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Award, Upload } from 'lucide-react'
import { getWorkerProfile, updateWorkerProfile, workerKeys, type WorkerProfile } from '../../api/worker'
import { useAuthStore } from '../../store/authStore'
import { TierBadge, type TierVariant } from '../../components/ui/TierBadge'
import { useToast } from '../../components/ui/toastStore'
import { Card, Initials, ProgressBar, SectionHeader, SkeletonBlock, WorkerPageTitle, dateShort, money, statusBadge } from './workerUtils'

const profileSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  city: z.string().min(2),
  bio: z.string().max(500),
  experienceLevel: z.string().min(1),
  rateMin: z.coerce.number().min(0),
  rateMax: z.coerce.number().min(0),
})

type ProfileForm = z.input<typeof profileSchema>
const tabs = ['About', 'Portfolio', 'Documents', 'Certifications', 'Tier & Trust'] as const

export const WorkerProfilePage = () => {
  const [tab, setTab] = useState<typeof tabs[number]>('About')
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const workerId = useAuthStore((state) => state.user?.id || 'worker-demo')
  const queryClient = useQueryClient()
  const { notify } = useToast()
  const profile = useQuery({ queryKey: workerKeys.profile(workerId), queryFn: () => getWorkerProfile(workerId) })
  const form = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) })
  const mutation = useMutation({
    mutationFn: (values: Partial<WorkerProfile>) => updateWorkerProfile(workerId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workerKeys.profile(workerId) })
      notify({ kind: 'success', title: 'Profile saved' })
    },
    onError: () => notify({ kind: 'error', title: 'Could not save profile' }),
  })

  useEffect(() => {
    if (!profile.data) return
    form.reset(profile.data)
    setSkills(profile.data.skills)
  }, [profile.data, form])

  if (profile.isLoading) return <SkeletonBlock className="h-96" />
  const data = profile.data
  if (!data) return null

  const addSkill = () => {
    const value = skillInput.trim()
    if (!value || skills.includes(value)) return
    setSkills((current) => [...current, value])
    setSkillInput('')
  }

  return (
    <div className="space-y-6">
      <WorkerPageTitle title="Profile" subtitle="Manage your worker profile, private documents, certifications, and trust tier." />
      <Card>
        <div className="flex flex-wrap gap-2 border-b border-border p-3">
          {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-md px-3 py-2 text-sm font-bold ${tab === item ? 'bg-blue text-white' : 'text-muted hover:bg-surface'}`}>{item}</button>)}
        </div>

        {tab === 'About' && (
          <form onSubmit={form.handleSubmit((values) => mutation.mutate({ ...values, rateMin: Number(values.rateMin), rateMax: Number(values.rateMax), skills }))} className="grid gap-5 p-6 md:grid-cols-[160px_1fr]">
            <div>
              <Initials value={data.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2)} className="h-24 w-24 text-2xl" />
              <button type="button" className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-blue"><Upload className="h-4 w-4" /> Photo</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {(['fullName', 'email', 'phone', 'city', 'experienceLevel', 'rateMin', 'rateMax'] as const).map((field) => (
                <label key={field} className="block">
                  <span className="text-xs font-bold uppercase text-navy">{field}</span>
                  <input {...form.register(field)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
                </label>
              ))}
              <label className="md:col-span-2">
                <span className="text-xs font-bold uppercase text-navy">Bio</span>
                <textarea {...form.register('bio')} className="mt-1 min-h-28 w-full rounded-md border border-border px-3 py-2 text-sm" />
              </label>
              <div className="md:col-span-2">
                <span className="text-xs font-bold uppercase text-navy">Skills</span>
                <div className="mt-2 flex gap-2">
                  <input value={skillInput} onChange={(event) => setSkillInput(event.target.value)} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
                  <button type="button" onClick={addSkill} className="rounded-md bg-blue px-3 py-2 text-sm font-bold text-white">Add</button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">{skills.map((skill) => <button key={skill} type="button" onClick={() => setSkills(skills.filter((item) => item !== skill))} className="rounded-full bg-amber-tint px-3 py-1 text-xs font-bold text-amber">{skill}</button>)}</div>
              </div>
              <button className="md:col-span-2 rounded-md bg-blue px-4 py-3 text-sm font-bold text-white">Save</button>
            </div>
          </form>
        )}

        {tab === 'Portfolio' && <div className="space-y-3 p-6">{data.portfolio.map((item) => <div key={item.id} className="rounded-lg border border-border p-4"><p className="font-bold text-navy">{item.url}</p><p className="text-sm text-muted">{item.description}</p></div>)}<button className="rounded-md bg-blue px-3 py-2 text-sm font-bold text-white">Add Entry</button><p className="text-xs text-muted">Maximum 5 portfolio entries enforced.</p></div>}
        {tab === 'Documents' && <div className="grid gap-4 p-6 md:grid-cols-2">{data.documents.map((doc) => <div key={doc.type} className="rounded-lg border border-border p-4"><p className="font-bold text-navy">{doc.type}</p><p className="mt-1 text-sm text-muted">{doc.filename}</p><div className="mt-3">{statusBadge(doc.status)}</div><button className="mt-4 rounded-md border border-border px-3 py-2 text-xs font-bold text-blue">Replace</button></div>)}</div>}
        {tab === 'Certifications' && <div className="grid gap-4 p-6 md:grid-cols-2">{data.certifications.map((cert) => <div key={cert.id} className="rounded-lg border border-border p-4"><p className="flex items-center gap-2 font-bold text-navy"><Award className="h-5 w-5 text-success" /> {cert.name}</p><p className="mt-2 text-sm text-muted">Score {cert.score}% · Issued {dateShort(cert.issuedDate)}</p></div>)}</div>}
        {tab === 'Tier & Trust' && (
          <div className="space-y-6 p-6">
            <div className="flex flex-wrap gap-2">{(['newcomer', 'verified', 'certified', 'pro', 'elite'] as TierVariant[]).map((tier) => <TierBadge key={tier} tier={tier} className={tier === data.tier ? 'ring-2 ring-blue' : ''} />)}</div>
            <Card>
              <SectionHeader title={`Trust Score: ${data.trust.reduce((sum, item) => sum + item.score, 0)}/100`} />
              <div className="space-y-4 p-5">{data.trust.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-xs font-bold text-muted"><span>{item.label}</span><span>{item.score}/{item.max}</span></div><ProgressBar value={(item.score / item.max) * 100} /></div>)}</div>
            </Card>
            <p className="text-sm text-muted">Rate range: {money(data.rateMin)} - {money(data.rateMax)}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
