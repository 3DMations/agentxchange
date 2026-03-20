import { SupabaseClient } from '@supabase/supabase-js'
import { PLATFORM_FEE_PCT } from '@/lib/constants'
import { createServiceLogger } from '@/lib/utils/logger'

const log = createServiceLogger('wallet-service')

export class WalletService {
  constructor(private supabase: SupabaseClient) {}

  async getBalance(agentId: string) {
    const { data, error } = await this.supabase.rpc('wallet_get_balance', {
      p_agent_id: agentId,
    })
    if (error) throw new WalletError(error.message)
    return data
  }

  async escrowLock(clientAgentId: string, jobId: string, amount: number, idempotencyKey: string) {
    log.info({ data: { clientAgentId, jobId, amount, idempotencyKey }, message: 'Locking escrow' })
    const { data, error } = await this.supabase.rpc('wallet_escrow_lock', {
      p_client_agent_id: clientAgentId,
      p_job_id: jobId,
      p_amount: amount,
      p_idempotency_key: idempotencyKey,
    })
    if (error) throw new WalletError(error.message)
    return data
  }

  async escrowRelease(jobId: string, serviceAgentId: string, idempotencyKey: string) {
    log.info({ data: { jobId, serviceAgentId, idempotencyKey }, message: 'Releasing escrow' })
    const { data, error } = await this.supabase.rpc('wallet_escrow_release', {
      p_job_id: jobId,
      p_service_agent_id: serviceAgentId,
      p_platform_fee_pct: PLATFORM_FEE_PCT,
      p_idempotency_key: idempotencyKey,
    })
    if (error) throw new WalletError(error.message)
    return data
  }

  async refund(jobId: string, idempotencyKey: string) {
    log.info({ data: { jobId, idempotencyKey }, message: 'Processing refund' })
    const { data, error } = await this.supabase.rpc('wallet_refund', {
      p_job_id: jobId,
      p_idempotency_key: idempotencyKey,
    })
    if (error) throw new WalletError(error.message)
    return data
  }

  async grantStarterBonus(agentId: string, amount: number, idempotencyKey: string) {
    const { data, error } = await this.supabase.rpc('wallet_grant_starter_bonus', {
      p_agent_id: agentId,
      p_amount: amount,
      p_idempotency_key: idempotencyKey,
    })
    if (error) throw new WalletError(error.message)
    return data
  }

  async getLedger(agentId: string, params: {
    type?: string
    from_date?: string
    to_date?: string
    cursor?: string
    limit: number
  }) {
    let query = this.supabase
      .from('wallet_ledger')
      .select('*', { count: 'exact' })
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(params.limit)

    if (params.type) query = query.eq('type', params.type)
    if (params.from_date) query = query.gte('created_at', params.from_date)
    if (params.to_date) query = query.lte('created_at', params.to_date)

    if (params.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(params.cursor, 'base64url').toString('utf-8'))
        query = query.lt('created_at', decoded.created_at)
      } catch { /* invalid cursor */ }
    }

    const { data, error, count } = await query
    if (error) throw new WalletError(error.message)

    const cursorNext = data && data.length === params.limit
      ? Buffer.from(JSON.stringify({
          id: data[data.length - 1].id,
          created_at: data[data.length - 1].created_at,
        })).toString('base64url')
      : undefined

    return { entries: data || [], cursor_next: cursorNext, total: count }
  }

  async reconciliationCheck() {
    const { data, error } = await this.supabase.rpc('wallet_reconciliation_check')
    if (error) throw new WalletError(error.message)
    return data
  }
}

export class WalletError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WalletError'
  }
}
