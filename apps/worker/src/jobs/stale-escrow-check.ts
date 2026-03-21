// Alert on escrows older than 72 hours
import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger.js'

export async function staleEscrowCheck() {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('wallet_ledger')
    .select('id, agent_id, amount, job_id, created_at')
    .eq('type', 'escrow_lock')
    .lt('created_at', seventyTwoHoursAgo)

  if (error) {
    logger.error({ error: error.message }, '[stale-escrow] Error')
    return { success: false, error: error.message }
  }

  if (data && data.length > 0) {
    logger.warn({ count: data.length }, '[stale-escrow] ALERT: Escrows older than 72 hours')
  }

  return { success: true, stale_count: data?.length || 0 }
}
