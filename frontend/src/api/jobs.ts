import { apiClient, dedupedGet, isApiMockEnabled } from './client'
import type { Job } from './worker'
export { jobKeys } from './queryKeys'

export interface JobSearchParams {
  page: number
  search?: string
  skills?: string[]
  payment_type?: string
  sort?: string
}

export interface PaginatedJobs {
  jobs: Job[]
  total: number
  page: number
  pageSize: number
}

export const getJobs = async (params: JobSearchParams): Promise<PaginatedJobs> => {
  try {
    return await dedupedGet<PaginatedJobs>('/jobs', {
      params: {
        page: params.page,
        q: params.search || undefined,
        skills: params.skills?.join(',') || undefined,
        payment_type: params.payment_type || undefined,
        sort: params.sort || undefined,
      },
    })
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    const { mockJobs } = await import('./worker')
    const filtered = mockJobs
      .filter((job) => !params.search || job.title.toLowerCase().includes(params.search.toLowerCase()))
      .filter((job) => !params.payment_type || params.payment_type === 'All' || job.paymentType === params.payment_type)
      .filter((job) => !params.skills?.length || params.skills.every((skill) => job.skills.includes(skill)))

    return {
      jobs: filtered,
      total: filtered.length,
      page: params.page,
      pageSize: 20,
    }
  }
}

export const getJob = async (id: string) => {
  try {
    return await dedupedGet<Job>(`/jobs/${id}`)
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    const { mockJobs } = await import('./worker')
    return mockJobs.find((job) => job.id === id) || mockJobs[0]
  }
}

export const applyToJob = async (id: string, coverNote: string) => {
  try {
    const response = await apiClient.post(`/jobs/${id}/apply`, { coverNote })
    return response.data
  } catch (error) {
    if (!isApiMockEnabled()) throw error
    return { ok: true }
  }
}
