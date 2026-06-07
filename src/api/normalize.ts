export interface PageResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const pageItems = <T>(value: T[] | PageResponse<T> | null | undefined): T[] => {
  if (Array.isArray(value)) return value
  return value?.items ?? []
}

export const pageResponse = <T>(value: T[] | PageResponse<T> | null | undefined): PageResponse<T> => {
  if (Array.isArray(value)) {
    return { items: value, total: value.length, page: 1, pageSize: value.length || 20, totalPages: 1 }
  }

  return value ?? { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }
}

export const titleCase = (value: unknown, fallback = '') => {
  const text = String(value ?? fallback).replace(/_/g, ' ').replace(/-/g, ' ').trim()
  if (!text) return fallback
  return text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
}

export const asIso = (value: unknown) => (value ? String(value) : new Date().toISOString())
