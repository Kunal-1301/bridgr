import { useMemo, useState } from 'react'
import { Button, Card, ProgressBar } from '../../design-system/components'

interface Props {
  initialClientBudget?: number
  initialMargin?: number
  onApply: (workerBudget: number, margin: number) => void
}

const usd = (value: number) => `$${Math.round(value)}/hr`

export const MarginCalculator = ({ initialClientBudget = 0, initialMargin = 33, onApply }: Props) => {
  const [clientBudget, setClientBudget] = useState(initialClientBudget)
  const [margin, setMargin] = useState(initialMargin)

  const calculated = useMemo(() => {
    const workerBudget = Math.round(clientBudget * (1 - margin / 100))
    return { workerBudget, keep: clientBudget - workerBudget }
  }, [clientBudget, margin])

  return (
    <Card className="p-5">
      <h2 className="text-section text-primary-800">Margin calculator</h2>
      <div className="mt-5 space-y-4">
        <label className="block text-caption font-bold uppercase text-primary-800">
          Client pays private
          <input type="number" value={clientBudget} onChange={(e) => setClientBudget(Number(e.target.value))} className="mt-2 h-[42px] w-full rounded-sm border border-neutral-200 px-3 text-body" />
        </label>
        <div>
          <div className="mb-2 flex justify-between text-caption font-bold uppercase text-primary-800">
            <span>Margin slider</span>
            <span>{margin}%</span>
          </div>
          <input type="range" min={10} max={60} value={margin} onChange={(e) => setMargin(Number(e.target.value))} className="w-full accent-accent-500" />
          <ProgressBar value={margin} max={60} />
        </div>
        <CalcRow label="Worker budget shown" value={usd(calculated.workerBudget)} />
        <CalcRow label="You keep" value={usd(calculated.keep)} />
        <Button variant="amber" className="w-full" onClick={() => onApply(calculated.workerBudget, margin)}>Apply to listing</Button>
      </div>
    </Card>
  )
}

const CalcRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between rounded-lg bg-neutral-50 p-4">
    <span className="text-body font-semibold text-neutral-600">{label}</span>
    <span className="font-mono text-lg font-bold text-primary-800">{value}</span>
  </div>
)
