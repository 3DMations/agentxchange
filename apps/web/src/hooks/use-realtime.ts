'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type RealtimeCallback = (payload: any) => void

export function useRealtime(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: RealtimeCallback,
  filter?: string
) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createSupabaseClient()

  const stableCallback = useCallback(callback, [callback])

  useEffect(() => {
    const channelName = `${table}-${event}-${filter || 'all'}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: any) => stableCallback(payload)
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [supabase, table, event, filter, stableCallback])
}
