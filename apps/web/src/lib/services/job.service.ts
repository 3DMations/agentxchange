import { SupabaseClient } from '@supabase/supabase-js'
import { WalletService } from './wallet.service'
import { WebhookService } from './webhook.service'
import { createServiceLogger } from '@/lib/utils/logger'
import { enqueueJob, QUEUE_NAMES } from '@/lib/queue/client'

const log = createServiceLogger('job-service')

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ['accepted', 'cancelled'],
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['submitted', 'disputed'],
  submitted: ['under_review', 'disputed'],
  under_review: ['completed', 'disputed'],
  completed: [],
  disputed: ['completed', 'cancelled'],
  cancelled: [],
}

export class JobService {
  private walletService: WalletService
  private webhookService: WebhookService

  constructor(private supabase: SupabaseClient) {
    this.walletService = new WalletService(supabase)
    this.webhookService = new WebhookService(supabase)
  }

  async createJob(clientAgentId: string, data: {
    description: string
    acceptance_criteria: string
    point_budget: number
    required_skills?: string[]
    tools_required?: string[]
  }) {
    log.info({ data: { clientAgentId, pointBudget: data.point_budget }, message: 'Creating new job' })
    // Get client's zone for zone_at_creation
    const { data: agent, error: agentError } = await this.supabase
      .from('agents')
      .select('zone')
      .eq('id', clientAgentId)
      .single()

    if (agentError || !agent) throw new Error('Agent not found')

    const { data: job, error } = await this.supabase
      .from('jobs')
      .insert({
        client_agent_id: clientAgentId,
        description: data.description,
        acceptance_criteria: data.acceptance_criteria,
        point_budget: data.point_budget,
        zone_at_creation: agent.zone,
        tools_used: data.tools_required || [],
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Dispatch webhook event for job creation
    this.dispatchWebhookAndEnqueue('job.created', job.client_agent_id, { job_id: job.id, status: 'open' })

    return job
  }

  async getJob(jobId: string) {
    const { data, error } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) throw new Error(error.message)
    return data
  }

  async listJobs(params: {
    status?: string
    zone?: string
    min_budget?: number
    max_budget?: number
    cursor?: string
    limit: number
  }) {
    let query = this.supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(params.limit)

    if (params.status) query = query.eq('status', params.status)
    if (params.zone) query = query.eq('zone_at_creation', params.zone)
    if (params.min_budget) query = query.gte('point_budget', params.min_budget)
    if (params.max_budget) query = query.lte('point_budget', params.max_budget)

    if (params.cursor) {
      try {
        const decoded = JSON.parse(Buffer.from(params.cursor, 'base64url').toString('utf-8'))
        query = query.lt('created_at', decoded.created_at)
      } catch { /* invalid cursor */ }
    }

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    const cursorNext = data && data.length === params.limit
      ? Buffer.from(JSON.stringify({
          id: data[data.length - 1].id,
          created_at: data[data.length - 1].created_at,
        })).toString('base64url')
      : undefined

    return { jobs: data || [], cursor_next: cursorNext, total: count }
  }

  async acceptJob(jobId: string, serviceAgentId: string, pointQuote: number, idempotencyKey: string) {
    log.info({ data: { jobId, serviceAgentId, pointQuote }, message: 'Accepting job' })
    const job = await this.getJob(jobId)
    this.validateTransition(job.status, 'accepted')

    // Lock escrow from client
    await this.walletService.escrowLock(job.client_agent_id, jobId, pointQuote, idempotencyKey)

    const { data, error } = await this.supabase
      .from('jobs')
      .update({
        status: 'accepted',
        service_agent_id: serviceAgentId,
        point_quote: pointQuote,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('status', 'open') // Optimistic concurrency
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Dispatch webhook event for job acceptance
    this.dispatchWebhookAndEnqueue('job.accepted', data.client_agent_id, {
      job_id: data.id, status: 'accepted', service_agent_id: serviceAgentId,
    })

    return data
  }

  async submitJob(jobId: string, serviceAgentId: string, deliverableId: string) {
    log.info({ data: { jobId, serviceAgentId, deliverableId }, message: 'Submitting job' })
    const job = await this.getJob(jobId)
    if (job.service_agent_id !== serviceAgentId) throw new Error('Not the assigned service agent')
    this.validateTransition(job.status, 'submitted')

    const { data, error } = await this.supabase
      .from('jobs')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Dispatch webhook event for job submission
    this.dispatchWebhookAndEnqueue('job.submitted', job.client_agent_id, {
      job_id: data.id, status: 'submitted', service_agent_id: serviceAgentId,
    })

    return data
  }

  async rateJob(jobId: string, clientAgentId: string, rating: {
    helpfulness_score: number
    solved: boolean
    feedback?: string
  }, idempotencyKey: string) {
    log.info({ data: { jobId, clientAgentId, rating: { helpfulness_score: rating.helpfulness_score, solved: rating.solved } }, message: 'Rating job' })
    const job = await this.getJob(jobId)
    if (job.client_agent_id !== clientAgentId) throw new Error('Not the job client')
    this.validateTransition(job.status, 'completed')

    // Release escrow to service agent
    if (job.service_agent_id) {
      await this.walletService.escrowRelease(jobId, job.service_agent_id, idempotencyKey)
    }

    const { data, error } = await this.supabase
      .from('jobs')
      .update({
        status: 'completed',
        helpfulness_score: rating.helpfulness_score,
        solved: rating.solved,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Enqueue reputation recalculation for the service agent
    if (job.service_agent_id) {
      enqueueJob(QUEUE_NAMES.REPUTATION_BATCH_RECALC, 'recalc-after-rating', {
        agentId: job.service_agent_id,
        jobId,
        rating: rating.helpfulness_score,
        solved: rating.solved,
      }).catch((err) => log.error({ data: { jobId, error: String(err) }, message: 'Failed to enqueue reputation recalc' }))
    }

    // Dispatch webhook event for job completion
    this.dispatchWebhookAndEnqueue('job.completed', clientAgentId, {
      job_id: data.id, status: 'completed', service_agent_id: job.service_agent_id,
      helpfulness_score: rating.helpfulness_score, solved: rating.solved,
    })

    return {
      job: data,
      reputation_update: { agent_id: job.service_agent_id, enqueued: true },
      xp_update: { agent_id: job.service_agent_id, enqueued: true },
    }
  }

  /**
   * Dispatch a webhook event and enqueue for async delivery.
   * Runs asynchronously — failures are logged but don't block the request.
   */
  private dispatchWebhookAndEnqueue(
    eventType: string,
    agentId: string,
    payload: Record<string, unknown>,
  ) {
    // Insert webhook event log entries, then enqueue one job per event for delivery
    this.webhookService.dispatchEvent(eventType, agentId, payload)
      .then((result) => {
        if (result.dispatched > 0 && result.eventIds) {
          // Enqueue one worker job per event — handler expects { eventId }
          for (const eventId of result.eventIds) {
            enqueueJob(QUEUE_NAMES.WEBHOOK_DISPATCH, 'dispatch', { eventId })
              .catch((err) => log.error({
                data: { eventType, eventId, error: String(err) },
                message: 'Failed to enqueue webhook dispatch',
              }))
          }
        }
      })
      .catch((err) => log.error({
        data: { eventType, error: String(err) },
        message: 'Failed to dispatch webhook event',
      }))
  }

  private validateTransition(currentStatus: string, targetStatus: string) {
    const allowed = VALID_TRANSITIONS[currentStatus]
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new Error(`Invalid transition: ${currentStatus} -> ${targetStatus}`)
    }
  }
}
