export const adminMetrics = {
  revenueMtd: 24800,
  grossMargin: 8200,
  activeJobs: 27,
  workers: 4210,
  pendingWorkers: 38,
}

export const revenueSeries = [
  { month: 'Jan', revenue: 18000, payouts: 11600, forecast: 19000 },
  { month: 'Feb', revenue: 21400, payouts: 13900, forecast: 21800 },
  { month: 'Mar', revenue: 23200, payouts: 15100, forecast: 24000 },
  { month: 'Apr', revenue: 24800, payouts: 16600, forecast: 26500 },
  { month: 'May', revenue: 27600, payouts: 18200, forecast: 29800 },
]

export const pendingQueue = [
  ['Worker verifications', 12],
  ['Client jobs to review', 3],
  ['Open support tickets', 6],
  ['Listings needing attention', 2],
] as const

export const verificationRows = [
  { id: 'w-neha', worker: 'Neha Patel', trust: 86, skills: ['React', 'Figma'], idProof: 'Aadhaar verified', status: 'Pending' },
  { id: 'w-vikram', worker: 'Vikram Rao', trust: 79, skills: ['Node.js', 'API'], idProof: 'PAN uploaded', status: 'Pending' },
  { id: 'w-sana', worker: 'Sana Khan', trust: 92, skills: ['UI Design', 'QA'], idProof: 'Passport verified', status: 'Under review' },
]

export const analytics = {
  revenueMtd: 24800,
  marginPercent: 33,
  nextMonthForecast: 31200,
  pipelineValue: 68400,
  automationHitRate: 68,
  workerPool: [
    { name: 'Verified', value: 2510 },
    { name: 'Certified', value: 980 },
    { name: 'Pro', value: 520 },
    { name: 'Elite', value: 200 },
  ],
  topSkills: [
    { skill: 'React', count: 840 },
    { skill: 'Node.js', count: 620 },
    { skill: 'UI Design', count: 540 },
    { skill: 'QA', count: 430 },
    { skill: 'Content', count: 360 },
  ],
}

export const automationSummary = {
  activeRules: 5,
  runsThisMonth: 1840,
  adminTimeSaved: '126 hrs',
  successRate: '94%',
}

export const automationRules = [
  { name: 'Auto-approve verified workers', trigger: 'Score >= 80 and docs complete', runs: 412, status: true },
  { name: 'Notify matched workers', trigger: 'Listing published', runs: 520, status: true },
  { name: 'Application follow-up', trigger: 'No response after 24h', runs: 308, status: true },
  { name: 'Payment reminder', trigger: 'Milestone due in 2 days', runs: 220, status: true },
  { name: 'Worker re-engagement', trigger: 'Inactive for 14 days', runs: 380, status: false },
]
