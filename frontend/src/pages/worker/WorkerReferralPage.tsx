import { useQuery } from '@tanstack/react-query'
import { Copy, Mail, MessageCircle, Send } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { getReferralStats, workerKeys } from '../../api/worker'
import { useToast } from '../../components/ui/toastStore'
import { Card, SectionHeader, SkeletonBlock, WorkerPageTitle, dateShort, money, statusBadge } from './workerUtils'

export const WorkerReferralPage = () => {
  const referrals = useQuery({ queryKey: workerKeys.referrals(), queryFn: getReferralStats })
  const { notify } = useToast()
  if (referrals.isLoading) return <SkeletonBlock className="h-80" />
  const data = referrals.data
  return (
    <div className="space-y-6">
      <WorkerPageTitle title="Referral" subtitle="Invite skilled workers and earn when they are approved." />
      <Card className="p-5">
        <p className="text-xs font-bold uppercase text-muted">Your referral link</p>
        <div className="mt-2 flex flex-col gap-3 rounded-lg bg-surface p-4 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-sm text-navy">{data?.link}</p>
          <button onClick={() => { navigator.clipboard.writeText(data?.link || ''); notify({ kind: 'success', title: 'Referral link copied' }) }} className="inline-flex items-center gap-2 rounded-md bg-blue px-3 py-2 text-xs font-bold text-white"><Copy className="h-4 w-4" /> Copy</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`https://wa.me/?text=${encodeURIComponent(data?.link || '')}`} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-blue"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(data?.link || '')}`} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-blue"><Send className="h-4 w-4" /> Telegram</a>
          <a href={`mailto:?subject=Join Bridgr&body=${encodeURIComponent(data?.link || '')}`} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-bold text-blue"><Mail className="h-4 w-4" /> Email</a>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Clicks" value={data?.clicks || 0} />
        <StatCard title="Sign-ups" value={data?.signups || 0} />
        <StatCard title="Approved" value={data?.approved || 0} />
        <StatCard title="Earnings" value={money(data?.earnings || 0)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><SectionHeader title="Leaderboard" /><div className="divide-y divide-border">{data?.leaderboard.map((row) => <div key={row.rank} className="flex items-center justify-between p-4 text-sm"><span className="font-bold text-navy">#{row.rank} {row.name}</span><span className="text-muted">{row.approved} approved · {money(row.earnings)}</span></div>)}</div></Card>
        <Card><SectionHeader title="Earnings History" /><div className="divide-y divide-border">{data?.history.map((row) => <div key={row.id} className="flex items-center justify-between p-4 text-sm"><span><strong className="text-navy">{row.worker}</strong><p className="text-xs text-muted">{dateShort(row.date)}</p></span><span>{statusBadge(row.status)} {money(row.amount)}</span></div>)}</div></Card>
      </div>
      <Card><SectionHeader title="How it works" /><div className="grid gap-4 p-5 md:grid-cols-3">{['Share your link', 'Worker applies and gets approved', 'Referral earnings are credited'].map((step, index) => <div key={step} className="rounded-lg bg-surface p-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-sm font-bold text-navy">{index + 1}</span><p className="mt-3 font-bold text-navy">{step}</p></div>)}</div></Card>
    </div>
  )
}
