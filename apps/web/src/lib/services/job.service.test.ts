import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/utils/logger', () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('@/lib/middleware/feature-toggle', () => ({
  isFeatureEnabled: vi.fn().mockResolvedValue(false),
}))

import { JobService } from './job.service'

function createMockSupabase() {
  return {
    from: vi.fn(),
    rpc: vi.fn(),
  } as any
}

// Helper to build a chainable mock that resolves to a given result
function chainMock(result: any) {
  const handler: any = () => new Proxy({}, { get: () => handler })
  // Create a terminal that resolves
  const terminal = vi.fn().mockResolvedValue(result)
  // Build chain functions that return objects with further chainable methods
  const buildChain = (depth: number): any => {
    if (depth <= 0) return terminal
    return vi.fn().mockReturnValue(
      new Proxy({}, {
        get: (_target, prop) => {
          if (prop === 'then') return undefined // Not a promise
          return buildChain(depth - 1)
        },
      })
    )
  }
  return buildChain
}

describe('JobService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let service: JobService

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    service = new JobService(mockSupabase)
  })

  // ── validateTransition ──

  describe('validateTransition - valid transitions', () => {
    const validTransitions: [string, string][] = [
      ['open', 'accepted'],
      ['open', 'cancelled'],
      ['accepted', 'in_progress'],
      ['accepted', 'cancelled'],
      ['in_progress', 'submitted'],
      ['in_progress', 'disputed'],
      ['submitted', 'under_review'],
      ['submitted', 'disputed'],
      ['under_review', 'completed'],
      ['under_review', 'disputed'],
      ['disputed', 'completed'],
      ['disputed', 'cancelled'],
    ]

    it.each(validTransitions)(
      '%s -> %s should not throw',
      (from, to) => {
        expect(() => (service as any).validateTransition(from, to)).not.toThrow()
      }
    )
  })

  describe('validateTransition - invalid transitions', () => {
    const invalidTransitions: [string, string][] = [
      ['open', 'completed'],
      ['open', 'in_progress'],
      ['accepted', 'completed'],
      ['accepted', 'submitted'],
      ['in_progress', 'accepted'],
      ['in_progress', 'completed'],
      ['submitted', 'open'],
      ['completed', 'open'],
      ['cancelled', 'open'],
    ]

    it.each(invalidTransitions)(
      '%s -> %s should throw "Invalid transition"',
      (from, to) => {
        expect(() => (service as any).validateTransition(from, to)).toThrow(
          `Invalid transition: ${from} -> ${to}`
        )
      }
    )
  })

  describe('validateTransition - terminal states', () => {
    it('completed has no valid transitions', () => {
      const targets = ['open', 'accepted', 'in_progress', 'submitted', 'under_review', 'completed', 'disputed', 'cancelled']
      for (const target of targets) {
        expect(() => (service as any).validateTransition('completed', target)).toThrow('Invalid transition')
      }
    })

    it('cancelled has no valid transitions', () => {
      const targets = ['open', 'accepted', 'in_progress', 'submitted', 'under_review', 'completed', 'disputed', 'cancelled']
      for (const target of targets) {
        expect(() => (service as any).validateTransition('cancelled', target)).toThrow('Invalid transition')
      }
    })

    it('throws for unknown current status', () => {
      expect(() => (service as any).validateTransition('unknown_status', 'open')).toThrow('Invalid transition')
    })
  })

  // ── createJob ──

  describe('createJob', () => {
    it('creates a job after looking up agent zone', async () => {
      const mockJob = { id: 'job-new', status: 'open', zone_at_creation: 'starter' }
      // First call: from('agents').select('zone').eq('id', ...).single()
      const agentSingle = vi.fn().mockResolvedValue({ data: { zone: 'starter' }, error: null })
      const agentEq = vi.fn().mockReturnValue({ single: agentSingle })
      const agentSelect = vi.fn().mockReturnValue({ eq: agentEq })
      // Second call: from('jobs').insert(...).select().single()
      const jobSingle = vi.fn().mockResolvedValue({ data: mockJob, error: null })
      const jobSelect = vi.fn().mockReturnValue({ single: jobSingle })
      const jobInsert = vi.fn().mockReturnValue({ select: jobSelect })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'agents') return { select: agentSelect }
        if (table === 'jobs') return { insert: jobInsert }
        return {}
      })

      const result = await service.createJob('client-1', {
        description: 'Build an API',
        acceptance_criteria: 'All tests pass',
        point_budget: 500,
        required_skills: ['typescript'],
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('agents')
      expect(mockSupabase.from).toHaveBeenCalledWith('jobs')
      expect(result).toEqual(mockJob)
    })

    it('throws when agent is not found', async () => {
      const agentSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found', code: 'PGRST116' } })
      const agentEq = vi.fn().mockReturnValue({ single: agentSingle })
      const agentSelect = vi.fn().mockReturnValue({ eq: agentEq })
      mockSupabase.from.mockReturnValue({ select: agentSelect })

      await expect(service.createJob('bad-agent', {
        description: 'test',
        acceptance_criteria: 'test',
        point_budget: 100,
      })).rejects.toThrow('Agent not found')
    })

    it('throws when job insert fails', async () => {
      const agentSingle = vi.fn().mockResolvedValue({ data: { zone: 'starter' }, error: null })
      const agentEq = vi.fn().mockReturnValue({ single: agentSingle })
      const agentSelect = vi.fn().mockReturnValue({ eq: agentEq })

      const jobSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } })
      const jobSelect = vi.fn().mockReturnValue({ single: jobSingle })
      const jobInsert = vi.fn().mockReturnValue({ select: jobSelect })

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'agents') return { select: agentSelect }
        if (table === 'jobs') return { insert: jobInsert }
        return {}
      })

      await expect(service.createJob('client-1', {
        description: 'test',
        acceptance_criteria: 'test',
        point_budget: 100,
      })).rejects.toThrow('Insert failed')
    })
  })

  // ── getJob ──

  describe('getJob', () => {
    it('returns job data', async () => {
      const mockJob = { id: 'job-1', status: 'open' }
      const single = vi.fn().mockResolvedValue({ data: mockJob, error: null })
      const eq = vi.fn().mockReturnValue({ single })
      const select = vi.fn().mockReturnValue({ eq })
      mockSupabase.from.mockReturnValue({ select })

      const result = await service.getJob('job-1')
      expect(result).toEqual(mockJob)
    })

    it('throws when job not found', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } })
      const eq = vi.fn().mockReturnValue({ single })
      const select = vi.fn().mockReturnValue({ eq })
      mockSupabase.from.mockReturnValue({ select })

      await expect(service.getJob('nonexistent')).rejects.toThrow('not found')
    })
  })

  // ── acceptJob ──

  describe('acceptJob', () => {
    it('locks escrow and updates job status to accepted', async () => {
      const existingJob = { id: 'job-1', status: 'open', client_agent_id: 'client-1', service_agent_id: null }
      const acceptedJob = { id: 'job-1', status: 'accepted', service_agent_id: 'service-1' }

      // getJob: from('jobs').select('*').eq('id', jobId).single()
      const getSingle = vi.fn().mockResolvedValue({ data: existingJob, error: null })
      const getEq = vi.fn().mockReturnValue({ single: getSingle })
      const getSelect = vi.fn().mockReturnValue({ eq: getEq })

      // acceptJob update chain: from('jobs').update({}).eq('id',).eq('status','open').select().single()
      const updateSingle = vi.fn().mockResolvedValue({ data: acceptedJob, error: null })
      const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
      const updateEq2 = vi.fn().mockReturnValue({ select: updateSelect })
      const updateEq1 = vi.fn().mockReturnValue({ eq: updateEq2 })
      const update = vi.fn().mockReturnValue({ eq: updateEq1 })

      let jobCallCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'jobs') {
          jobCallCount++
          if (jobCallCount === 1) return { select: getSelect }
          return { update }
        }
        return {}
      })

      // escrowLock rpc
      mockSupabase.rpc.mockResolvedValueOnce({ data: { locked: true }, error: null })

      const result = await service.acceptJob('job-1', 'service-1', 400, 'idem-accept')

      expect(mockSupabase.rpc).toHaveBeenCalledWith('wallet_escrow_lock', {
        p_client_agent_id: 'client-1',
        p_job_id: 'job-1',
        p_amount: 400,
        p_idempotency_key: 'idem-accept',
      })
      expect(result).toEqual(acceptedJob)
    })

    it('throws when job is not in open status', async () => {
      const existingJob = { id: 'job-1', status: 'completed', client_agent_id: 'client-1' }
      const getSingle = vi.fn().mockResolvedValue({ data: existingJob, error: null })
      const getEq = vi.fn().mockReturnValue({ single: getSingle })
      const getSelect = vi.fn().mockReturnValue({ eq: getEq })
      mockSupabase.from.mockReturnValue({ select: getSelect })

      await expect(service.acceptJob('job-1', 'service-1', 400, 'idem-x'))
        .rejects.toThrow('Invalid transition: completed -> accepted')
    })
  })

  // ── submitJob ──

  describe('submitJob', () => {
    it('submits job when called by the assigned service agent', async () => {
      const existingJob = { id: 'job-1', status: 'in_progress', service_agent_id: 'service-1' }
      const submittedJob = { id: 'job-1', status: 'submitted' }

      const getSingle = vi.fn().mockResolvedValue({ data: existingJob, error: null })
      const getEq = vi.fn().mockReturnValue({ single: getSingle })
      const getSelect = vi.fn().mockReturnValue({ eq: getEq })

      const submitSingle = vi.fn().mockResolvedValue({ data: submittedJob, error: null })
      const submitSelect = vi.fn().mockReturnValue({ single: submitSingle })
      const submitEq = vi.fn().mockReturnValue({ select: submitSelect })
      const submitUpdate = vi.fn().mockReturnValue({ eq: submitEq })

      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++
        if (callCount === 1) return { select: getSelect }
        return { update: submitUpdate }
      })

      const result = await service.submitJob('job-1', 'service-1', 'del-1')
      expect(result).toEqual(submittedJob)
    })

    it('throws when called by a different agent than assigned', async () => {
      const existingJob = { id: 'job-1', status: 'in_progress', service_agent_id: 'service-1' }
      const getSingle = vi.fn().mockResolvedValue({ data: existingJob, error: null })
      const getEq = vi.fn().mockReturnValue({ single: getSingle })
      const getSelect = vi.fn().mockReturnValue({ eq: getEq })
      mockSupabase.from.mockReturnValue({ select: getSelect })

      await expect(service.submitJob('job-1', 'wrong-agent', 'del-1'))
        .rejects.toThrow('Not the assigned service agent')
    })
  })

  // ── rateJob ──

  describe('rateJob', () => {
    it('releases escrow and completes job on successful rating', async () => {
      const existingJob = {
        id: 'job-1', status: 'under_review',
        client_agent_id: 'client-1', service_agent_id: 'service-1',
      }
      const completedJob = { id: 'job-1', status: 'completed', helpfulness_score: 5, solved: true }

      const getSingle = vi.fn().mockResolvedValue({ data: existingJob, error: null })
      const getEq = vi.fn().mockReturnValue({ single: getSingle })
      const getSelect = vi.fn().mockReturnValue({ eq: getEq })

      const rateSingle = vi.fn().mockResolvedValue({ data: completedJob, error: null })
      const rateSelect = vi.fn().mockReturnValue({ single: rateSingle })
      const rateEq = vi.fn().mockReturnValue({ select: rateSelect })
      const rateUpdate = vi.fn().mockReturnValue({ eq: rateEq })

      let callCount = 0
      mockSupabase.from.mockImplementation(() => {
        callCount++
        if (callCount === 1) return { select: getSelect }
        return { update: rateUpdate }
      })

      // escrowRelease rpc (called via walletService internally)
      mockSupabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null })

      const result = await service.rateJob('job-1', 'client-1', {
        helpfulness_score: 5,
        solved: true,
        feedback: 'Great work',
      }, 'idem-rate-1')

      expect(result.job).toEqual(completedJob)
      expect(result.reputation_update).toEqual({ agent_id: 'service-1', enqueued: true })
      expect(result.xp_update).toEqual({ agent_id: 'service-1', enqueued: true })
    })

    it('throws when called by a non-client agent', async () => {
      const existingJob = {
        id: 'job-1', status: 'under_review',
        client_agent_id: 'client-1', service_agent_id: 'service-1',
      }
      const getSingle = vi.fn().mockResolvedValue({ data: existingJob, error: null })
      const getEq = vi.fn().mockReturnValue({ single: getSingle })
      const getSelect = vi.fn().mockReturnValue({ eq: getEq })
      mockSupabase.from.mockReturnValue({ select: getSelect })

      await expect(service.rateJob('job-1', 'wrong-client', {
        helpfulness_score: 5,
        solved: true,
      }, 'idem-x')).rejects.toThrow('Not the job client')
    })

    it('throws when transition is invalid', async () => {
      const existingJob = {
        id: 'job-1', status: 'open',
        client_agent_id: 'client-1', service_agent_id: null,
      }
      const getSingle = vi.fn().mockResolvedValue({ data: existingJob, error: null })
      const getEq = vi.fn().mockReturnValue({ single: getSingle })
      const getSelect = vi.fn().mockReturnValue({ eq: getEq })
      mockSupabase.from.mockReturnValue({ select: getSelect })

      await expect(service.rateJob('job-1', 'client-1', {
        helpfulness_score: 5,
        solved: true,
      }, 'idem-x')).rejects.toThrow('Invalid transition: open -> completed')
    })
  })
})
