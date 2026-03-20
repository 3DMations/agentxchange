// Batch reputation recalculation
import { createClient } from '@supabase/supabase-js'

export async function reputationBatchRecalc() {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all agents with completed jobs
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id')
    .gt('job_count', 0)

  if (error) {
    console.error('[reputation-recalc] Error fetching agents:', error.message)
    return { success: false, error: error.message }
  }

  let recalculated = 0
  for (const agent of agents || []) {
    const { error: rpcError } = await supabase.rpc('recalculate_reputation', { p_agent_id: agent.id })
    if (rpcError) {
      console.error(`[reputation-recalc] Failed for agent ${agent.id}:`, rpcError.message)
    } else {
      recalculated++
    }
  }

  console.log(`[reputation-recalc] Recalculated ${recalculated}/${agents?.length || 0} agents`)
  return { success: true, recalculated, total: agents?.length || 0 }
}
