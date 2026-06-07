import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Bell, CreditCard, Copy, PlusCircle, Save } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { clientKeys, createSetupIntent, getClientProfile, updateClientProfile, type ClientProfile } from '../../api/clientPortal'
import { useToast } from '../../components/ui/toastStore'
import { Card, SectionHeader, SkeletonBlock } from './clientUtils'

export const ClientProfilePage = () => {
  const profile = useQuery({ queryKey: clientKeys.profile(), queryFn: getClientProfile })
  const [form, setForm] = useState<ClientProfile | null>(null)
  const { notify } = useToast()

  useEffect(() => {
    if (profile.data) setForm(profile.data)
  }, [profile.data])

  const save = useMutation({
    mutationFn: () => updateClientProfile(form || {}),
    onSuccess: () => notify({ kind: 'success', title: 'Profile updated' }),
  })
  const setup = useMutation({
    mutationFn: createSetupIntent,
    onSuccess: () => notify({ kind: 'success', title: 'Stripe setup intent created', message: 'Connect the payment method in the secure Stripe flow.' }),
  })

  if (profile.isLoading || !form) return <SkeletonBlock />

  const update = (key: keyof ClientProfile, value: string) => setForm((current) => current ? { ...current, [key]: value } : current)

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Company details, billing settings, and client account preferences." />
      <div className="grid gap-6 xl:grid-cols-[1.25fr_.85fr]">
        <Card>
          <SectionHeader title="Company Info" subtitle="These details appear on client-side billing and support records." />
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {[
              ['companyName', 'Company name'],
              ['contactName', 'Contact person'],
              ['email', 'Email'],
              ['country', 'Country'],
            ].map(([key, label]) => (
              <label key={key} className="text-sm font-semibold text-navy">
                {label}
                <input value={String(form[key as keyof ClientProfile])} onChange={(event) => update(key as keyof ClientProfile, event.target.value)} className="mt-2 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal outline-none focus:border-blue focus:ring-1 focus:ring-blue" />
              </label>
            ))}
            <label className="md:col-span-2 text-sm font-semibold text-navy">
              Billing address
              <textarea value={form.billingAddress} onChange={(event) => update('billingAddress', event.target.value)} className="mt-2 min-h-28 w-full rounded-md border border-border px-3 py-2.5 text-sm font-normal outline-none focus:border-blue focus:ring-1 focus:ring-blue" />
            </label>
            <div className="md:col-span-2">
              <button onClick={() => save.mutate()} className="inline-flex items-center gap-2 rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white">
                <Save className="h-4 w-4" /> Save Changes
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionHeader title="Payment Methods" />
            <div className="space-y-3 p-5">
              {form.paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue" />
                    <div>
                      <p className="font-bold text-navy">{method.brand} ending {method.last4}</p>
                      <p className="text-xs text-muted">Expires {method.expiry}</p>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => setup.mutate()} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-bold text-navy">
                <PlusCircle className="h-4 w-4" /> Add payment method
              </button>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Account Settings" />
            <div className="space-y-4 p-5">
              <label className="flex items-center justify-between gap-4 rounded-lg bg-surface p-4 text-sm font-semibold text-navy">
                <span className="inline-flex items-center gap-2"><Bell className="h-4 w-4 text-blue" /> Email notifications</span>
                <input type="checkbox" defaultChecked className="h-4 w-4 accent-blue" />
              </label>
              <div className="rounded-lg border border-border p-4">
                <p className="font-bold text-navy">Clone a past job</p>
                <div className="mt-3 space-y-2">
                  {form.completedJobs.map((job) => (
                    <button key={job.id} onClick={() => notify({ kind: 'info', title: 'Draft prepared', message: `${job.title} can be cloned into a new submission.` })} className="flex w-full items-center justify-between rounded-md bg-surface px-3 py-2 text-left text-sm font-semibold text-navy">
                      {job.title} <Copy className="h-4 w-4 text-blue" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
