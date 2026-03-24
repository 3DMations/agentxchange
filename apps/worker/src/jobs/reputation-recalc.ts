// Batch reputation recalculation with configurable batch size
// When agentId/rating/solved are provided, also grants XP and checks zone promotion
import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger.js'

/** Maximum agents to process per batch to prevent memory issues */
const DEFAULT_BATCH_SIZE = 50

/** Base XP awarded for completing a job */
const BASE_XP = parseInt(process.env.XP_BASE_COMPLETION || '10', 10)

/** Bonus XP for high ratings (>= 4) */
const HIGH_RATING_BONUS = parseInt(process.env.XP_HIGH_RATING_BONUS || '5', 10)

/** Bonus XP when the job was marked as solved */
const SOLVED_BONUS = parseInt(process.env.XP_SOLVED_BONUS || '10', 10)

export interface ReputationRecalcData {
  batchSize?: number
  agentId?: string
  jobId?: string
  rating?: number
  solved?: boolean
}

/**
 * Calculate XP to grant based on job completion context.
 * Formula: base 10 + 5 if rating >= 4 + 10 if solved
 */
export function calculateXp(rating?: number, solved?: boolean): number {
  let xp = BASE_XP
  if (rating != null && rating >= 4) xp += HIGH_RATING_BONUS
  if (solved) xp += SOLVED_BONUS
  return xp
}

export async function reputationBatchRecalc(data?: ReputationRecalcData) {
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

  // If this recalc was triggered by a specific job rating, grant XP and check zone promotion
  let xpGrant: { xp: number; promoted?: boolean } | undefined
  if (data?.agentId && data?.rating != null) {
    const xp = calculateXp(data.rating, data.solved)
    try {
      const { data: rpcResult, error: xpError } = await supabase.rpc('grant_xp_and_check_promotion', {
        p_agent_id: data.agentId,
        p_base_xp: xp,
        p_rating: data.rating,
        p_solved: data.solved ?? false,
      })

      if (xpError) {
        logger.error(
          { agentId: data.agentId, jobId: data.jobId, xp, error: xpError.message },
          '[reputation-recalc] XP grant failed'
        )
      } else {
        const promoted = rpcResult?.promoted ?? false
        xpGrant = { xp, promoted }
        logger.info(
          { agentId: data.agentId, jobId: data.jobId, xp, promoted },
          '[reputation-recalc] XP granted'
        )
      }
    } catch (err) {
      logger.error(
        { agentId: data.agentId, jobId: data.jobId, error: (err as Error).message },
        '[reputation-recalc] XP grant threw unexpected error'
      )
    }
  }

  return { success: errors === 0, recalculated, total, errors, xpGrant }
}
