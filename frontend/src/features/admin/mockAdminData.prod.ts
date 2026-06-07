export const adminMetrics = {
  revenueMtd: 0,
  grossMargin: 0,
  activeJobs: 0,
  workers: 0,
  pendingWorkers: 0,
}

export const revenueSeries: { month: string; revenue: number; payouts: number; forecast: number }[] = []
export const pendingQueue: readonly (readonly [string, number])[] = []
export const verificationRows: {
  id: string
  worker: string
  trust: number
  skills: string[]
  idProof: string
  status: string
}[] = []

export const analytics = {
  revenueMtd: 0,
  marginPercent: 0,
  nextMonthForecast: 0,
  pipelineValue: 0,
  automationHitRate: 0,
  workerPool: [],
  topSkills: [],
}

export const automationSummary = {
  activeRules: 0,
  runsThisMonth: 0,
  adminTimeSaved: '0 hrs',
  successRate: '0%',
}

export const automationRules: { name: string; trigger: string; runs: number; status: boolean }[] = []
