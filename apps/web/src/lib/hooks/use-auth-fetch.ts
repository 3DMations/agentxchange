'use client'

import { useCallback, useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

export interface UseAuthFetchReturn {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>
  isAuthenticated: boolean
}

/**
 * Provides an authenticated fetch function that attaches the Supabase
 * session token as an Authorization header. Returns parsed JSON data
 * after unwrapping the ApiResponse envelope.
 *
 * Throws on error with the error message from the API response.
 */
export function useAuthFetch(): UseAuthFetchReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
    })
  }, [])

  const authFetch = useCallback(
    async <T>(url: string, options?: RequestInit): Promise<T> => {
      const supabase = createSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const headers = new Headers(options?.headers)
      if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`)
        setIsAuthenticated(true)
      }

      const res = await fetch(url, { ...options, headers })
      const json = await res.json()

      if (!res.ok || json.error) {
        const message =
          typeof json.error === 'string'
            ? json.error
            : json.error?.message ?? `Request failed (${res.status})`
        throw new Error(message)
      }

      return json.data as T
    },
    []
  )

  return { authFetch, isAuthenticated }
}
