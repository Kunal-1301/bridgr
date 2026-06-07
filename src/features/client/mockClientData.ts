import { addDays, subDays } from 'date-fns'
import type { ClientInvoice, ClientJob, ClientProfile, SupportTicket } from '../../api/clientPortal'

export const mockClientJobs: ClientJob[] = [
  {
    id: 'cj-dashboard',
    title: 'Customer dashboard redesign',
    description: 'Redesign the customer dashboard with a cleaner information hierarchy, responsive tables, and manager-reviewed handoff.',
    skills: ['React', 'Dashboard UI', 'QA'],
    status: 'Active',
    submissionDate: subDays(new Date(), 18).toISOString(),
    budget: 12500,
    paymentType: 'Milestone-based',
    progress: 62,
    milestones: [
      { id: 'm1', name: 'Discovery & wireframes', dueDate: subDays(new Date(), 12).toISOString(), amount: 1500, status: 'Paid' },
      { id: 'm2', name: 'Component library', dueDate: subDays(new Date(), 4).toISOString(), amount: 2500, status: 'Paid' },
      { id: 'm3', name: 'Dashboard build', dueDate: addDays(new Date(), 3).toISOString(), amount: 3000, status: 'Pending' },
      { id: 'm4', name: 'QA & handoff', dueDate: addDays(new Date(), 16).toISOString(), amount: 2500, status: 'Pending' },
    ],
    deliverables: [
      { name: 'Responsive dashboard screens', status: 'In progress' },
      { name: 'Component handoff notes', status: 'In progress' },
      { name: 'QA fixes', status: 'Upcoming' },
    ],
    updates: [
      { id: 'u1', type: 'Manager update', message: 'The component library is approved. Dashboard build is moving into implementation.', timestamp: subDays(new Date(), 1).toISOString() },
      { id: 'u2', type: 'Milestone', message: 'Discovery and component library milestones were marked paid.', timestamp: subDays(new Date(), 4).toISOString() },
    ],
  },
  {
    id: 'cj-marketing',
    title: 'Marketing site rebuild',
    description: 'Rebuild the marketing site with a refreshed responsive design, landing pages, and SEO-ready content structure.',
    skills: ['Web Dev', 'Design', 'SEO'],
    status: 'Active',
    submissionDate: subDays(new Date(), 11).toISOString(),
    budget: 18200,
    paymentType: 'Fixed',
    progress: 44,
    milestones: [
      { id: 'm5', name: 'Site architecture', dueDate: subDays(new Date(), 2).toISOString(), amount: 4200, status: 'Paid' },
      { id: 'm6', name: 'Page buildout', dueDate: addDays(new Date(), 9).toISOString(), amount: 6500, status: 'Pending' },
    ],
    deliverables: [{ name: 'Responsive pages', status: 'In progress' }],
    updates: [{ id: 'u3', type: 'Manager update', message: 'Homepage and pricing page are ready for review this week.', timestamp: subDays(new Date(), 2).toISOString() }],
  },
  {
    id: 'cj-qa',
    title: 'Mobile app QA',
    description: 'Run a structured QA pass across mobile app flows and provide prioritized issue reports.',
    skills: ['QA', 'Mobile', 'Testing'],
    status: 'Active',
    submissionDate: subDays(new Date(), 6).toISOString(),
    budget: 17500,
    paymentType: 'Fixed',
    progress: 31,
    milestones: [{ id: 'm7', name: 'QA cycle', dueDate: addDays(new Date(), 8).toISOString(), amount: 5000, status: 'Pending' }],
    deliverables: [{ name: 'QA report', status: 'In progress' }],
    updates: [{ id: 'u4', type: 'Manager update', message: 'Smoke testing is complete. Regression pass begins next.', timestamp: subDays(new Date(), 1).toISOString() }],
  },
]

export const mockInvoices: ClientInvoice[] = [
  { id: 'inv-1008', invoiceNo: 'BR-1008', job: 'Customer dashboard redesign', amount: 1500, date: subDays(new Date(), 14).toISOString(), status: 'Paid' },
  { id: 'inv-1012', invoiceNo: 'BR-1012', job: 'Customer dashboard redesign', amount: 2500, date: subDays(new Date(), 5).toISOString(), status: 'Paid' },
  { id: 'inv-1020', invoiceNo: 'BR-1020', job: 'Customer dashboard redesign', amount: 3000, date: addDays(new Date(), 3).toISOString(), status: 'Pending' },
  { id: 'inv-1023', invoiceNo: 'BR-1023', job: 'Marketing site rebuild', amount: 3500, date: addDays(new Date(), 9).toISOString(), status: 'Pending' },
]

export const mockProfile: ClientProfile = {
  companyName: 'Northwind Co.',
  contactName: 'Maya Chen',
  email: 'maya@northwind.example',
  country: 'United States',
  billingAddress: '88 Market Street, San Francisco, CA',
  paymentMethods: [{ id: 'pm-1', brand: 'Visa', last4: '4242', expiry: '04/29' }],
  completedJobs: [{ id: 'cj-complete', title: 'Analytics reporting sprint' }],
}

export const mockTickets: SupportTicket[] = [
  {
    id: 'st-1',
    subject: 'Question about next milestone',
    category: 'Payment Issue',
    status: 'In Progress',
    lastUpdated: subDays(new Date(), 1).toISOString(),
    messages: [
      { id: 'tm-1', sender: 'Client', body: 'Can you confirm what is included in the next milestone invoice?', timestamp: subDays(new Date(), 2).toISOString() },
      { id: 'tm-2', sender: 'Admin', body: 'Yes. It covers dashboard build progress and manager QA review.', timestamp: subDays(new Date(), 1).toISOString() },
    ],
  },
]

export const mockClientDashboard = {
  stats: {
    activeProjects: 3,
    totalSpent: 48200,
    pendingPayments: 6500,
    openJobs: 3,
    avgTimeToFill: 2.4,
  },
  activeProjects: mockClientJobs,
  activity: mockClientJobs.flatMap((job) => job.updates),
  nextPayment: {
    project: 'Customer dashboard redesign',
    amount: 3000,
    due: addDays(new Date(), 3).toISOString(),
  },
}
