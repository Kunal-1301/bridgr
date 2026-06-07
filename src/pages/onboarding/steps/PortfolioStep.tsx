import { Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '../../../design-system/components'
import type { OnboardingDraft, OnboardingErrors, PortfolioEntry } from '../WorkerOnboardingPage'

interface StepProps {
  draft: OnboardingDraft
  errors: OnboardingErrors
  updateDraft: <K extends keyof OnboardingDraft>(field: K, value: OnboardingDraft[K]) => void
}

export const PortfolioStep = ({ draft, updateDraft }: StepProps) => {
  const updateEntry = (index: number, entry: Partial<PortfolioEntry>) => {
    updateDraft('portfolio', draft.portfolio.map((item, itemIndex) => itemIndex === index ? { ...item, ...entry } : item))
  }

  const removeEntry = (index: number) => {
    updateDraft('portfolio', draft.portfolio.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-page-title text-primary-800">Show your best work</h1>
        <p className="mt-2 text-body text-neutral-600">Add up to 5 links or files. GitHub, Dribbble, Behance, or case studies work well.</p>
      </div>
      <div className="space-y-3">
        {draft.portfolio.map((entry, index) => (
          <div key={index} className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <Input label={`Link ${index + 1}`} value={entry.url} placeholder="https://..." onChange={(event) => updateEntry(index, { url: event.target.value })} />
            <label className="block">
              <span className="mb-1.5 block text-caption font-bold uppercase text-primary-800">File example</span>
              <input
                type="file"
                className="block w-full text-caption text-neutral-600 file:mr-3 file:rounded-sm file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-caption file:font-bold file:text-primary-800"
                onChange={(event) => updateEntry(index, { file: event.target.files?.[0] ?? null })}
              />
            </label>
            {entry.file && <p className="text-caption font-semibold text-success">{entry.file.name}</p>}
            {draft.portfolio.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeEntry(index)} iconLeft={<Trash2 className="h-4 w-4" />}>
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={draft.portfolio.length >= 5}
          onClick={() => updateDraft('portfolio', [...draft.portfolio, { url: '', file: null }])}
          iconLeft={<Plus className="h-4 w-4" />}
        >
          Add work
        </Button>
        <span className="text-caption text-neutral-600">Can skip</span>
      </div>
    </div>
  )
}
