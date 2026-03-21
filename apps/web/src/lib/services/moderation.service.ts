import { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createServiceLogger } from '@/lib/utils/logger'

const log = createServiceLogger('moderation-service')

export class ModerationService {
  constructor(private supabase: SupabaseClient) {}

  async createDispute(raisedBy: string, data: { job_id: string; reason: string; evidence?: string }) {
    log.info({ data: { raisedBy, jobId: data.job_id }, message: 'Creating dispute' })
    // Update job status to disputed
    await this.supabase
      .from('jobs')
      .update({ status: 'disputed' })
      .eq('id', data.job_id)

    const { data: dispute, error } = await this.supabase
      .from('disputes')
      .insert({
        job_id: data.job_id,
        raised_by: raisedBy,
        reason: data.reason,
        evidence: data.evidence,
        audit_trail: [{ action: 'opened', by: raisedBy, at: new Date().toISOString() }],
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Update job's dispute_id
    await this.supabase
      .from('jobs')
      .update({ dispute_id: dispute.id })
      .eq('id', data.job_id)

    return dispute
  }

  async listDisputes(params: {
    status?: string; priority?: string; cursor?: string; limit: number;
  }, agentId?: string, isAdmin = false) {
    let query = isAdmin
      ? supabaseAdmin.from('disputes').select('*', { count: 'exact' })
      : this.supabase.from('disputes').select('*', { count: 'exact' })

    if (params.status) query = query.eq('status', params.status)
    if (params.priority) query = query.eq('priority', params.priority)

    query = query.order('opened_at', { ascending: false }).limit(params.limit)

    if (params.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(params.cursor, 'base64url').toString('utf-8'))
        query = query.lt('opened_at', decoded.opened_at)
      } catch { /* invalid cursor */ }
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const cursorNext = data && data.length === params.limit
      ? Buffer.from(JSON.stringify({ opened_at: data[data.length - 1].opened_at })).toString('base64url')
      : undefined

    return { disputes: data || [], cursor_next: cursorNext, total: count }
  }

  async resolveDispute(disputeId: string, resolution: string, resolvedBy: string) {
    log.info({ data: { disputeId, resolvedBy }, message: 'Resolving dispute' })
    const { data, error } = await supabaseAdmin
      .from('disputes')
      .update({
        status: 'resolved',
        resolution,
        resolved_at: new Date().toISOString(),
        audit_trail: undefined,
      })
      .eq('id', disputeId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async issueSanction(agentId: string, type: 'warn' | 'suspend' | 'ban', reason: string, issuedBy: string, disputeId?: string) {
    log.info({ data: { agentId, type, issuedBy }, message: 'Issuing sanction' })
    const { error: sanctionError } = await supabaseAdmin
      .from('sanctions')
      .insert({
        agent_id: agentId,
        type,
        reason,
        dispute_id: disputeId,
        issued_by: issuedBy,
      })

    if (sanctionError) throw new Error(sanctionError.message)

    // Update agent suspension status
    if (type === 'suspend' || type === 'ban') {
      const status = type === 'suspend' ? 'suspended' : 'banned'
      await supabaseAdmin
        .from('agents')
        .update({ suspension_status: status })
        .eq('id', agentId)
    }

    return { sanctioned: true, type }
  }

  async detectCollusion(agentId1: string, agentId2: string) {
    // Validate UUID format before using in filter to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(agentId1) || !uuidRegex.test(agentId2)) {
      throw new Error('Invalid agent ID format')
    }

    // Flag agent pairs with >3 mutual jobs and >4.5 avg mutual rating
    const { data: mutualJobs, error } = await this.supabase
      .from('jobs')
      .select('helpfulness_score')
      .or(`and(client_agent_id.eq.${agentId1},service_agent_id.eq.${agentId2}),and(client_agent_id.eq.${agentId2},service_agent_id.eq.${agentId1})`)
      .eq('status', 'completed')

    if (error) throw new Error(error.message)
    if (!mutualJobs || mutualJobs.length <= 3) return { flagged: false }

    const avgRating = mutualJobs.reduce((sum, j) => sum + (j.helpfulness_score || 0), 0) / mutualJobs.length
    return {
      flagged: avgRating > 4.5,
      mutual_jobs: mutualJobs.length,
      avg_mutual_rating: avgRating,
    }
  }
}
