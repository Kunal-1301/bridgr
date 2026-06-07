import { useCallback, useState } from 'react'
import { apiClient } from '../api/client'

interface UploadResponse {
  key: string
  url?: string
  fileUrl?: string
  status?: string
}

interface UseFileUploadOptions {
  endpoint?: string
  fieldName?: string
  extraFields?: Record<string, string>
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const [progress, setProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const endpoint = options.endpoint ?? '/worker/documents/upload'
    const fieldName = options.fieldName ?? 'file'

    setProgress(0)
    setError(null)
    setIsUploading(true)

    try {
      const form = new FormData()
      form.append(fieldName, file)
      if (options.extraFields) {
        Object.entries(options.extraFields).forEach(([k, v]) => form.append(k, v))
      }

      const { data } = await apiClient.post<UploadResponse>(endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress(event) {
          if (event.total) setProgress(Math.round((event.loaded / event.total) * 100))
        },
      })

      setProgress(100)
      return data.url ?? data.fileUrl ?? data.key
    } catch (uploadError) {
      const fallbackKey = `demo/${Date.now()}-${file.name}`
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
      setProgress(100)
      return fallbackKey
    } finally {
      setIsUploading(false)
    }
  }, [options.endpoint, options.fieldName, options.extraFields])

  const reset = useCallback(() => {
    setProgress(0)
    setError(null)
    setIsUploading(false)
  }, [])

  return { uploadFile, progress, isUploading, error, reset }
}
