import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { Calculator, Save } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { TierBadge } from '../../components/ui/TierBadge'
import { useToast } from '../../components/ui/toastStore'
import { adminKeys, getAdminWorker, recalculateWorkerTrust, updateWorkerNotes, updateWorkerVerification, type WorkerStatus } from '../../api/admin'
import { Card, SkeletonBlock, TrustBar, dateShort, inr, workerStatusBadge } from './adminUtils'

const tabs = ['Profile', 'Documents', 'Applications', 'Projects', 'Certifications', 'Activity'] as const
const statuses: WorkerStatus[] = ['Approved', 'Pending', 'Under Review', 'Rejected', 'Suspended', 'Flagged']

export const AdminWorkerDetailPage = () => {
  const { id = '' } = useParams()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Profile')
  const [status, setStatus] = useState<WorkerStatus>('Pending')
  const [reason, setReason] = useState('')
  const [adminRating, setAdminRating] = useState(8)
  const [jobId, setJobId] = useState('listing-ops-dashboard')
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const { notify } = useToast()
  const worker = useQuery({ queryKey: adminKeys.worker(id), queryFn: () => getAdminWorker(id) })
  const saveNotes = useMutation({ mutationFn: () => updateWorkerNotes(id, notes), onSuccess: () => notify({ kind: 'success', title: 'Internal notes saved' }) })
  const updateStatus = useMutation({ mutationFn: () => updateWorkerVerification(id, { status, reason }), onSuccess: () => notify({ kind: 'success', title: 'Worker status updated' }) })
  const recalc = useMutation({
    mutationFn: () => recalculateWorkerTrust(id, { adminRating }),
    onSuccess: (result) => notify({ kind: 'success', title: 'Trust score recalculated', message: `New score: ${result.score}` }),
  })

  if (worker.isLoading) return <SkeletonBlock />
  if (!worker.data) return <Card className="p-6 text-sm text-muted">Worker not found.</Card>

  if (!notes && worker.data.adminNotes) setNotes(worker.data.adminNotes)
  if (status === 'Pending' && worker.data.status !== 'Pending') setStatus(worker.data.status)
  const needsReason = status === 'Rejected' || status === 'Suspended'

  return (
    <div className="space-y-6">
      <PageHeader title={worker.data.fullName} subtitle="Full admin-only worker dossier." />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.75fr]">
        <Card>
          <div className="flex gap-2 overflow-x-auto border-b border-border p-4">
            {tabs.map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`rounded-md px-4 py-2 text-sm font-bold ${tab === item ? 'bg-blue text-white' : 'bg-surface text-muted hover:text-navy'}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="p-5">
            {tab === 'Profile' ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ['Email', worker.data.email],
                    ['Phone', worker.data.phone],
                    ['City', worker.data.city],
                    ['DOB', dateShort(worker.data.dateOfBirth)],
                    ['Experience', worker.data.experience],
                    ['Rate Range', `${inr(worker.data.rateMin)} - ${inr(worker.data.rateMax)}`],
                  ].map(([label, value]) => <Info key={label} label={label} value={value} />)}
                </div>
                <Info label="Bio" value={worker.data.bio} />
                <div>
                  <p className="text-xs font-bold uppercase text-muted">Skills</p>
                  <div className="mt-2 flex flex-wrap gap-2">{worker.data.skills.map((skill) => <span key={skill} className="rounded-full bg-amber-tint px-3 py-1 text-xs font-bold text-navy">{skill}</span>)}</div>
                </div>
                <label className="block text-sm font-semibold text-navy">
                  Internal Notes
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 min-h-32 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal" />
                </label>
                <button onClick={() => saveNotes.mutate()} className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><Save className="h-4 w-4" /> Save Notes</button>
              </div>
            ) : null}

            {tab === 'Documents' ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['Resume', worker.data.documents.resume, 'PDF/DOCX viewer'],
                  [`ID Proof (${worker.data.documents.idType})`, worker.data.documents.id, 'Government ID viewer'],
                  ['Portfolio', worker.data.documents.portfolio, 'Links and uploads'],
                ].map(([label, ok, description]) => (
                  <div key={String(label)} className="rounded-lg border border-border p-4">
                    <p className="font-bold text-navy">{label}</p>
                    <p className="mt-2 text-sm text-muted">{description}</p>
                    <p className={`mt-3 text-sm font-bold ${ok ? 'text-success' : 'text-error'}`}>{ok ? 'Uploaded' : 'Missing'}</p>
                    <button className="mt-4 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white">Approve Document</button>
                  </div>
                ))}
              </div>
            ) : null}

            {tab === 'Applications' ? <List rows={worker.data.applications.map((item) => [item.jobTitle, `${item.status} · ${dateShort(item.date)} · ${item.outcome}`])} /> : null}
            {tab === 'Projects' ? <List rows={worker.data.projects.map((item) => [item.title, `${item.role} · ${item.dates} · ${item.outcome}`])} /> : null}
            {tab === 'Certifications' ? <List rows={worker.data.certifications.map((item) => [item.name, `Score ${item.score}% · issued ${dateShort(item.issuedDate)}`])} /> : null}
            {tab === 'Activity' ? <List rows={worker.data.activity.map((item) => [item.action, dateShort(item.timestamp)])} /> : null}
          </div>
        </Card>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="p-5">
            <h2 className="text-lg font-bold text-navy">Status Control</h2>
            <div className="mt-4">{workerStatusBadge(worker.data.status)}</div>
            <select value={status} onChange={(e) => setStatus(e.target.value as WorkerStatus)} className="mt-4 w-full rounded-md border border-border px-3 py-2 text-sm">
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>
            {needsReason ? <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason required" className="mt-3 min-h-24 w-full rounded-md border border-border px-3 py-2 text-sm" /> : null}
            <button disabled={needsReason && !reason.trim()} onClick={() => updateStatus.mutate()} className="mt-4 w-full rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Update Status</button>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-bold text-navy">Trust Score</h2>
            <div className="mt-4"><TrustBar score={worker.data.trustScore} /></div>
            {['ID Verified', 'Projects Completed', 'No Disputes', 'Punctuality', 'Certifications'].map((factor) => (
              <label key={factor} className="mt-4 block text-xs font-bold uppercase text-muted">
                {factor}
                <input type="range" min={0} max={20} defaultValue={factor === 'Projects Completed' ? 24 : 15} className="mt-2 w-full accent-blue" />
              </label>
            ))}
            <label className="mt-4 block text-xs font-bold uppercase text-muted">
              Admin Rating
              <input type="number" min={1} max={10} value={adminRating} onChange={(e) => setAdminRating(Number(e.target.value))} className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm" />
            </label>
            <button onClick={() => recalc.mutate()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white"><Calculator className="h-4 w-4" /> Recalculate</button>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-bold text-navy">Tier Badge</h2>
            <div className="mt-3"><TierBadge tier={worker.data.tier} /></div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-bold text-navy">Match Score</h2>
            <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="mt-4 w-full rounded-md border border-border px-3 py-2 text-sm">
              <option value="listing-ops-dashboard">Ops Dashboard Listing</option>
              <option value="listing-seo">SEO Content Listing</option>
            </select>
            <button onClick={() => setMatchScore(Math.min(98, Math.round(worker.data.trustScore * 0.72 + worker.data.skills.length * 7)))} className="mt-3 w-full rounded-md bg-amber px-4 py-2 text-sm font-bold text-navy">Check Match</button>
            {matchScore !== null ? <p className="mt-4 text-2xl font-extrabold text-navy">{matchScore}/100</p> : null}
          </Card>
        </aside>
      </div>
    </div>
  )
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-surface p-4">
    <p className="text-xs font-bold uppercase text-muted">{label}</p>
    <p className="mt-2 text-sm font-semibold leading-6 text-navy">{value}</p>
  </div>
)

const List = ({ rows }: { rows: string[][] }) => (
  <div className="divide-y divide-border rounded-lg border border-border">
    {rows.length ? rows.map(([title, meta]) => <div key={`${title}-${meta}`} className="p-4"><p className="font-bold text-navy">{title}</p><p className="mt-1 text-sm text-muted">{meta}</p></div>) : <p className="p-5 text-sm text-muted">No records yet.</p>}
  </div>
)
