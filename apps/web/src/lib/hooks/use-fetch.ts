'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface UseFetchOptions<T> {
  /** Whether to fetch immediately on mount (default true) */
  immediate?: boolean
  /** Transform the raw data from the API response */
  transform?: (data: any) => T
}

export interface UseFetchReturn<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  refetch: () => Promise<void>
}

const RETRY_DELAY_MS = 2000
const MAX_RETRIES = 1

/**
 * Data-fetching hook with automatic ApiResponse envelope handling,
 * AbortController cleanup, and a single automatic retry on network failure.
 *
 * @param url - The URL to fetch
 * @param options - Configuration options
 */
export function useFetch<T>(
  url: string,
  options?: UseFetchOptions<T>
): UseFetchReturn<T> {
  const { immediate = true, transform } = options ?? {}

  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(immediate)

  // Track whether the component is still mounted
  const mountedRef = useRef(true)
  // Track the current AbortController for cleanup
  const controllerRef = useRef<AbortController | null>(null)
  // Ref for transform to avoid re-triggering useCallback/useEffect on every render
  const transformRef = useRef(transform)
  transformRef.current = transform

  const fetchData = useCallback(async () => {
    // Abort any in-flight request
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setIsLoading(true)
    setError(null)

    let lastError: string | null = null

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (controller.signal.aborted) return

      try {
        const res = await fetch(url, { signal: controller.signal })

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`)
        }

        const json = await res.json()

        // Unwrap ApiResponse envelope
        if (json.error) {
          const message =
            typeof json.error === 'string'
              ? json.error
              : json.error?.message ?? 'Unknown error'
          throw new Error(message)
        }

        const result = transformRef.current ? transformRef.current(json.data) : (json.data as T)

        if (mountedRef.current && !controller.signal.aborted) {
          setData(result)
          setError(null)
          setIsLoading(false)
        }
        return
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return

        lastError =
          err instanceof Error ? err.message : 'An unexpected error occurred'

        // Retry on network failures only (not HTTP errors we already parsed)
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
          continue
        }
      }
    }

    // All attempts exhausted
    if (mountedRef.current && !controller.signal.aborted) {
      setError(lastError)
      setIsLoading(false)
    }
  }, [url])

  useEffect(() => {
    mountedRef.current = true

    if (immediate) {
      fetchData()
    }

    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [fetchData, immediate])

  return { data, error, isLoading, refetch: fetchData }
}
