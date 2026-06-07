import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'worker', 'client', 'affiliate']).optional(),
})

export const workerRegistrationSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.email(),
  password: z.string().min(8),
  phone: z.string().min(7).max(32),
  city: z.string().min(2).max(80),
  dateOfBirth: z.string().optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string().min(1)).min(1).max(15),
  experienceLevel: z.string().min(2).max(80).optional(),
  rateMin: z.coerce.number().nonnegative(),
  rateMax: z.coerce.number().nonnegative(),
  portfolioLinks: z.array(z.url()).max(10).optional(),
}).refine((value) => value.rateMax >= value.rateMin, {
  message: 'Maximum rate must be greater than or equal to minimum rate',
  path: ['rateMax'],
})

const milestoneSchema = z.object({
  title: z.string().min(2).max(120),
  amount: z.coerce.number().positive(),
  dueDate: z.string().min(1),
})

export const clientJobSubmissionSchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(2000),
  requiredSkills: z.array(z.string().min(1)).min(1).max(10),
  paymentType: z.enum(['Fixed', 'Milestone-based', 'Hourly']),
  totalBudget: z.coerce.number().positive().optional(),
  milestones: z.array(milestoneSchema).optional(),
  estimatedHours: z.coerce.number().positive().optional(),
  hourlyRate: z.coerce.number().positive().optional(),
  teamSize: z.coerce.number().int().positive(),
  deadline: z.string().min(1),
  deliverables: z.array(z.string().min(2)).min(1),
  notes: z.string().max(2000).optional(),
  attachmentKeys: z.array(z.string()).max(5).optional(),
})

export const jobListingCreationSchema = z.object({
  sourceClientJobId: z.string().min(1).optional(),
  title: z.string().min(8).max(140),
  description: z.string().min(50).max(4000),
  requiredSkills: z.array(z.string().min(1)).min(1).max(15),
  paymentType: z.enum(['Fixed', 'Milestone', 'Hourly']),
  workerBudget: z.coerce.number().positive(),
  clientBudget: z.coerce.number().positive().optional(),
  marginPercent: z.coerce.number().min(0).max(90).optional(),
  teamSize: z.coerce.number().int().positive(),
  deadline: z.string().min(1),
  visibility: z.enum(['Open', 'Skills-filtered', 'Invite-only']),
  visibilitySkills: z.array(z.string()).optional(),
  invitedWorkerIds: z.array(z.string()).optional(),
  minTier: z.enum(['newcomer', 'verified', 'certified', 'pro', 'elite']),
})

export const paymentMarkingSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.coerce.number().positive().optional(),
  method: z.string().min(1).max(80).optional(),
  paidAt: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

export type LoginPayload = z.infer<typeof loginSchema>
export type WorkerRegistrationPayload = z.infer<typeof workerRegistrationSchema>
export type ClientJobSubmissionPayload = z.infer<typeof clientJobSubmissionSchema>
export type JobListingCreationPayload = z.infer<typeof jobListingCreationSchema>
export type PaymentMarkingPayload = z.infer<typeof paymentMarkingSchema>
