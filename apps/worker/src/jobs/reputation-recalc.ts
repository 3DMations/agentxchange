// Batch reputation recalculation with configurable batch size
import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger.js'

/** Maximum agents to process per batch to prevent memory issues */
const DEFAULT_BATCH_SIZE = 50

export async function reputationBatchRecalc(data?: { batchSize?: number }) {
  const batchSize = data?.batchSize ?? parseInt(process.env.REPUTATION_BATCH_SIZE || String(DEFAULT_BATCH_SIZE), 10)
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Paginate agents to prevent loading all into memory
  let offset = 0
  let recalculated = 0
  let total = 0
  let errors = 0

  while (true) {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id')
      .gt('job_count', 0)
      .range(offset, offset + batchSize - 1)

    if (error) {
      logger.error({ error: error.message, offset }, '[reputation-recalc] Error fetching agents batch')
      return { success: false, error: error.message, recalculated, total, errors }
    }

    if (!agents || agents.length === 0) break

    total += agents.length

    for (const agent of agents) {
      const { error: rpcError } = await supabase.rpc('recalculate_reputation', { p_agent_id: agent.id })
      if (rpcError) {
        logger.error({ agentId: agent.id, error: rpcError.message }, '[reputation-recalc] Failed for agent')
        errors++
      } else {
        recalculated++
      }
    }

    logger.info({ offset, batchSize, processed: agents.length }, '[reputation-recalc] Batch complete')

    // If we got fewer than batchSize, we're done
    if (agents.length < batchSize) break
    offset += batchSize
  }

  logger.info({ recalculated, total, errors }, '[reputation-recalc] Recalculation complete')
  return { success: errors === 0, recalculated, total, errors }
}
