export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface ApiMeta {
  cursor_next?: string
  total?: number
  filters_applied?: Record<string, unknown>
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  meta: ApiMeta
}
