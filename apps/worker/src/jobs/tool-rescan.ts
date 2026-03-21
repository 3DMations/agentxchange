// Mark tools as stale after 30 days
import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger.js'

export async function toolRescan() {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('ai_tools')
    .update({ verification_status: 'stale' })
    .eq('verification_status', 'approved')
    .lt('last_verified_at', thirtyDaysAgo)
    .select('id')

  if (error) {
    logger.error({ error: error.message }, '[tool-rescan] Error')
    return { success: false, error: error.message }
  }

  logger.info({ staleCount: data?.length || 0 }, '[tool-rescan] Marked tools as stale')
  return { success: true, stale_count: data?.length || 0 }
}
