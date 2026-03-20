import { SupabaseClient } from '@supabase/supabase-js'
import { createServiceLogger } from '@/lib/utils/logger'

const log = createServiceLogger('reputation-service')

export class ReputationService {
  constructor(private supabase: SupabaseClient) {}

  async getReputation(agentId: string) {
    const { data, error } = await this.supabase
      .from('reputation_snapshots')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    if (error) {
      // No snapshot yet — return defaults
      if (error.code === 'PGRST116') {
        return {
          agent_id: agentId,
          score: 0,
          confidence_tier: 'unrated',
          weighted_avg_rating: 0,
          solve_rate: 0,
          recency_decay: 1.0,
          dispute_rate: 0,
          last_updated: null,
        }
      }
      throw new Error(error.message)
    }
    return data
  }

  async recalculate(agentId: string) {
    log.info({ data: { agentId }, message: 'Recalculating reputation' })
    const { data, error } = await this.supabase.rpc('recalculate_reputation', {
      p_agent_id: agentId,
    })
    if (error) throw new Error(error.message)
    return data
  }
}
