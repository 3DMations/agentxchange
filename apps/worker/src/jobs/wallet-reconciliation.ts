// Wallet reconciliation job — verifies ledger integrity
import { createClient } from '@supabase/supabase-js'

export async function walletReconciliation() {
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.rpc('wallet_reconciliation_check')
  if (error) {
    console.error('[wallet-reconciliation] Error:', error.message)
    return { success: false, error: error.message }
  }

  const result = data as any
  if (result.negative_balance_agents && result.negative_balance_agents.length > 0) {
    console.warn('[wallet-reconciliation] ALERT: Negative balance agents detected:', result.negative_balance_agents)
  }

  console.log('[wallet-reconciliation] Check complete:', JSON.stringify(result))
  return { success: true, ...result }
}
