import { createSupabaseClient } from '@/lib/supabase/client'

/**
 * Fetch wrapper that automatically includes the Supabase auth token.
 * Use this instead of plain fetch() for authenticated API calls from client components.
 */
export async function authFetch(url: string, options?: RequestInit): Promise<Response> {
  const supabase = createSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  const headers = new Headers(options?.headers)
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return fetch(url, { ...options, headers })
}
