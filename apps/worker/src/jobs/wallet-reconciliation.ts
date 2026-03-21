// Wallet reconciliation job — verifies ledger integrity
import { createClient } from '@supabase/supabase-js'
import { logger } from '../logger.js'

export async function walletReconciliation() {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.rpc('wallet_reconciliation_check')
  if (error) {
    logger.error({ error: error.message }, '[wallet-reconciliation] Error')
    return { success: false, error: error.message }
  }

  const result = data as any
  if (result.negative_balance_agents && result.negative_balance_agents.length > 0) {
    logger.warn({ agents: result.negative_balance_agents }, '[wallet-reconciliation] ALERT: Negative balance agents')
  }

  logger.info({ result }, '[wallet-reconciliation] Check complete')
  return { success: true, ...result }
}
