import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePassword, requestDeleteAccount, updatePreferences } from '../../api/worker'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/toastStore'
import { Card, SectionHeader, WorkerPageTitle } from './workerUtils'

const passwordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine((data) => data.newPassword === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords must match' })
type PasswordForm = z.infer<typeof passwordSchema>

export const WorkerSettingsPage = () => {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [prefs, setPrefs] = useState({ jobAlerts: true, paymentUpdates: true, system: true, channel: 'Both' })
  const { notify } = useToast()
  const form = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })
  const passwordMutation = useMutation({ mutationFn: changePassword, onSuccess: () => notify({ kind: 'success', title: 'Password changed' }), onError: () => notify({ kind: 'error', title: 'Could not change password' }) })
  const prefsMutation = useMutation({ mutationFn: updatePreferences, onSuccess: () => notify({ kind: 'success', title: 'Preferences saved' }), onError: () => notify({ kind: 'error', title: 'Could not save preferences' }) })
  const deleteMutation = useMutation({ mutationFn: requestDeleteAccount, onSuccess: () => notify({ kind: 'success', title: 'Delete request submitted' }) })

  return (
    <div className="space-y-6">
      <WorkerPageTitle title="Settings" subtitle="Manage password, email preferences, notification channel, and account requests." />
      <Card>
        <SectionHeader title="Change Password" />
        <form onSubmit={form.handleSubmit((values) => passwordMutation.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword }))} className="grid gap-4 p-5 md:grid-cols-3">
          {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
            <label key={field}>
              <span className="text-xs font-bold uppercase text-navy">{field}</span>
              <input type="password" {...form.register(field)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
              {form.formState.errors[field] ? <p className="mt-1 text-xs text-error">{form.formState.errors[field]?.message}</p> : null}
            </label>
          ))}
          <button className="rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white md:col-span-3">Update Password</button>
        </form>
      </Card>
      <Card>
        <SectionHeader title="Email Preferences" />
        <div className="space-y-4 p-5">
          {(['jobAlerts', 'paymentUpdates', 'system'] as const).map((key) => <label key={key} className="flex items-center justify-between rounded-md bg-surface p-4 text-sm font-bold text-navy"><span>{key}</span><input type="checkbox" checked={prefs[key]} onChange={(event) => setPrefs((current) => ({ ...current, [key]: event.target.checked }))} /></label>)}
          <label className="block">
            <span className="text-xs font-bold uppercase text-navy">Notification Channel</span>
            <select value={prefs.channel} onChange={(event) => setPrefs((current) => ({ ...current, channel: event.target.value }))} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
              {['Email', 'In-app', 'Both'].map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <button onClick={() => prefsMutation.mutate(prefs)} className="rounded-md bg-blue px-4 py-2.5 text-sm font-bold text-white">Save Preferences</button>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="text-base font-bold text-error">Delete account request</h2>
        <p className="mt-2 text-sm text-muted">This submits an admin-reviewed request. Active projects and payouts must be settled first.</p>
        <button onClick={() => setDeleteOpen(true)} className="mt-4 rounded-md bg-error px-4 py-2.5 text-sm font-bold text-white">Request Delete</button>
      </Card>
      <ConfirmModal isOpen={deleteOpen} onClose={setDeleteOpen} title="Request account deletion?" description="An admin will review the request and contact you before any account action is taken." confirmText="Submit Request" onConfirm={() => deleteMutation.mutate()} />
    </div>
  )
}
