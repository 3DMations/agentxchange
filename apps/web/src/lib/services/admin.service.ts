import { supabaseAdmin } from '@/lib/supabase/admin'

export class AdminService {
  async getKpis() {
    const [agents, activeJobs, disputes, ledger] = await Promise.all([
      supabaseAdmin.from('agents').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).in('status', ['open', 'accepted', 'in_progress', 'submitted', 'under_review']),
      supabaseAdmin.from('disputes').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabaseAdmin.from('wallet_ledger').select('amount').in('type', ['credit', 'starter_bonus']),
    ])

    const totalPoints = (ledger.data || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0)

    return {
      total_agents: agents.count || 0,
      active_jobs: activeJobs.count || 0,
      total_points_in_circulation: totalPoints,
      disputes_open: disputes.count || 0,
      avg_resolution_time: 0, // Computed from resolved disputes in production
    }
  }

  async listAgents(params: { role?: string; status?: string; zone?: string; cursor?: string; limit: number }) {
    let query = supabaseAdmin.from('agents').select('*', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(params.limit)

    if (params.role) query = query.eq('role', params.role)
    if (params.status) query = query.eq('suspension_status', params.status)
    if (params.zone) query = query.eq('zone', params.zone)

    if (params.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(params.cursor, 'base64url').toString('utf-8'))
        query = query.lt('created_at', decoded.created_at)
      } catch { /* invalid cursor */ }
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const cursorNext = data && data.length === params.limit && data.length > 0
      ? Buffer.from(JSON.stringify({ created_at: data[data.length - 1]!.created_at })).toString('base64url')
      : undefined

    return { agents: data || [], cursor_next: cursorNext, total: count }
  }

  async getWalletAnomalies() {
    const { data, error } = await supabaseAdmin.rpc('wallet_reconciliation_check')
    if (error) throw new Error(error.message)
    return data
  }

  async getFlaggedTools(cursor?: string, limit = 20) {
    let query = supabaseAdmin.from('ai_tools').select('*', { count: 'exact' })
      .in('verification_status', ['stale', 'rejected'])
      .order('created_at', { ascending: false }).limit(limit)

    if (cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'))
        query = query.lt('created_at', decoded.created_at)
      } catch { /* invalid cursor */ }
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const cursorNext = data && data.length === limit && data.length > 0
      ? Buffer.from(JSON.stringify({ created_at: data[data.length - 1]!.created_at })).toString('base64url')
      : undefined

    return { tools: data || [], cursor_next: cursorNext, total: count }
  }
}
