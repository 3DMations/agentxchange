import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

vi.mock('@/lib/utils/logger', () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import { ModerationService } from './moderation.service'
import { supabaseAdmin } from '@/lib/supabase/admin'

const mockedAdmin = vi.mocked(supabaseAdmin)

function createMockSupabase() {
  return {
    from: vi.fn(),
  } as any
}

describe('ModerationService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let service: ModerationService

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    service = new ModerationService(mockSupabase)
  })

  it('should instantiate', () => {
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    expect(typeof service.createDispute).toBe('function')
    expect(typeof service.listDisputes).toBe('function')
    expect(typeof service.resolveDispute).toBe('function')
    expect(typeof service.issueSanction).toBe('function')
    expect(typeof service.detectCollusion).toBe('function')
  })

  // ── createDispute ──

  describe('createDispute', () => {
    it('updates job status to disputed and inserts dispute record', async () => {
      const mockDispute = { id: 'dispute-1', status: 'open', job_id: 'job-1', raised_by: 'agent-1' }

      // First from('jobs').update({status:'disputed'}).eq('id', jobId)
      const jobUpdateEq = vi.fn().mockResolvedValue({ error: null })
      const jobUpdate = vi.fn().mockReturnValue({ eq: jobUpdateEq })

      // Second from('disputes').insert(...).select().single()
      const disputeSingle = vi.fn().mockResolvedValue({ data: mockDispute, error: null })
      const disputeSelect = vi.fn().mockReturnValue({ single: disputeSingle })
      const disputeInsert = vi.fn().mockReturnValue({ select: disputeSelect })

      // Third from('jobs').update({dispute_id}).eq('id', jobId)
      const jobUpdate2Eq = vi.fn().mockResolvedValue({ error: null })
      const jobUpdate2 = vi.fn().mockReturnValue({ eq: jobUpdate2Eq })

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'jobs' && callCount === 1) return { update: jobUpdate }
        if (table === 'disputes') return { insert: disputeInsert }
        if (table === 'jobs') return { update: jobUpdate2 }
        return {}
      })

      const result = await service.createDispute('agent-1', {
        job_id: 'job-1',
        reason: 'Work not delivered',
        evidence: 'Screenshots attached',
      })

      expect(result).toEqual(mockDispute)
      expect(jobUpdateEq).toHaveBeenCalledWith('id', 'job-1')
    })

    it('throws when dispute insert fails', async () => {
      const jobUpdateEq = vi.fn().mockResolvedValue({ error: null })
      const jobUpdate = vi.fn().mockReturnValue({ eq: jobUpdateEq })

      const disputeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert error' } })
      const disputeSelect = vi.fn().mockReturnValue({ single: disputeSingle })
      const disputeInsert = vi.fn().mockReturnValue({ select: disputeSelect })

      let callCount = 0
      mockSupabase.from.mockImplementation((table: string) => {
        callCount++
        if (table === 'jobs') return { update: jobUpdate }
        if (table === 'disputes') return { insert: disputeInsert }
        return {}
      })

      await expect(service.createDispute('agent-1', {
        job_id: 'job-1',
        reason: 'Bad work',
      })).rejects.toThrow('Insert error')
    })
  })

  // ── listDisputes ──

  describe('listDisputes', () => {
    it('returns disputes with pagination from admin client when isAdmin', async () => {
      const disputes = [
        { id: 'd1', status: 'open', opened_at: '2026-03-01T00:00:00Z' },
        { id: 'd2', status: 'open', opened_at: '2026-02-28T00:00:00Z' },
      ]
      const mockLimit = vi.fn().mockResolvedValue({ data: disputes, error: null, count: 5 })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      mockedAdmin.from = vi.fn().mockReturnValue({ select: mockSelect }) as any

      const result = await service.listDisputes(
        { status: 'open', limit: 2 },
        undefined,
        true,
      )

      expect(mockedAdmin.from).toHaveBeenCalledWith('disputes')
      expect(result.disputes).toEqual(disputes)
      expect(result.total).toBe(5)
      expect(result.cursor_next).toBeDefined()
    })

    it('uses user supabase client when not admin', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await service.listDisputes({ limit: 10 }, 'agent-1', false)

      expect(mockSupabase.from).toHaveBeenCalledWith('disputes')
      expect(result.disputes).toEqual([])
      expect(result.cursor_next).toBeUndefined()
    })

    it('throws when query fails', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: null, error: { message: 'Query error' }, count: null })
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit })
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      await expect(service.listDisputes({ limit: 10 })).rejects.toThrow('Query error')
    })
  })

  // ── resolveDispute ──

  describe('resolveDispute', () => {
    it('updates dispute status to resolved via admin client', async () => {
      const resolved = { id: 'd1', status: 'resolved', resolution: 'Refund issued' }
      const single = vi.fn().mockResolvedValue({ data: resolved, error: null })
      const select = vi.fn().mockReturnValue({ single })
      const eq = vi.fn().mockReturnValue({ select })
      const update = vi.fn().mockReturnValue({ eq })

      mockedAdmin.from = vi.fn().mockReturnValue({ update }) as any

      const result = await service.resolveDispute('d1', 'Refund issued', 'admin-1')

      expect(mockedAdmin.from).toHaveBeenCalledWith('disputes')
      expect(result).toEqual(resolved)
    })

    it('throws when update fails', async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } })
      const select = vi.fn().mockReturnValue({ single })
      const eq = vi.fn().mockReturnValue({ select })
      const update = vi.fn().mockReturnValue({ eq })

      mockedAdmin.from = vi.fn().mockReturnValue({ update }) as any

      await expect(service.resolveDispute('d1', 'resolution', 'admin-1')).rejects.toThrow('Update failed')
    })
  })

  // ── issueSanction ──

  describe('issueSanction', () => {
    it('inserts a warn sanction without updating agent status', async () => {
      const insertResult = vi.fn().mockResolvedValue({ error: null })

      mockedAdmin.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'sanctions') return { insert: insertResult }
        return {}
      }) as any

      const result = await service.issueSanction('agent-1', 'warn', 'Spamming', 'mod-1', 'dispute-1')

      expect(result).toEqual({ sanctioned: true, type: 'warn' })
      expect(mockedAdmin.from).toHaveBeenCalledWith('sanctions')
    })

    it('suspends agent when sanction type is suspend', async () => {
      const insertResult = vi.fn().mockResolvedValue({ error: null })
      const updateEq = vi.fn().mockResolvedValue({ error: null })
      const updateFn = vi.fn().mockReturnValue({ eq: updateEq })

      mockedAdmin.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'sanctions') return { insert: insertResult }
        if (table === 'agents') return { update: updateFn }
        return {}
      }) as any

      const result = await service.issueSanction('agent-1', 'suspend', 'Fraud', 'mod-1')

      expect(result).toEqual({ sanctioned: true, type: 'suspend' })
      expect(updateFn).toHaveBeenCalledWith({ suspension_status: 'suspended' })
      expect(updateEq).toHaveBeenCalledWith('id', 'agent-1')
    })

    it('bans agent when sanction type is ban', async () => {
      const insertResult = vi.fn().mockResolvedValue({ error: null })
      const updateEq = vi.fn().mockResolvedValue({ error: null })
      const updateFn = vi.fn().mockReturnValue({ eq: updateEq })

      mockedAdmin.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'sanctions') return { insert: insertResult }
        if (table === 'agents') return { update: updateFn }
        return {}
      }) as any

      const result = await service.issueSanction('agent-1', 'ban', 'Repeated violations', 'mod-1')

      expect(result).toEqual({ sanctioned: true, type: 'ban' })
      expect(updateFn).toHaveBeenCalledWith({ suspension_status: 'banned' })
    })

    it('throws when sanction insert fails', async () => {
      const insertResult = vi.fn().mockResolvedValue({ error: { message: 'Sanction insert failed' } })

      mockedAdmin.from = vi.fn().mockReturnValue({ insert: insertResult }) as any

      await expect(service.issueSanction('agent-1', 'warn', 'test', 'mod-1'))
        .rejects.toThrow('Sanction insert failed')
    })
  })

  // ── detectCollusion ──

  describe('detectCollusion', () => {
    it('returns flagged=false when fewer than 4 mutual jobs', async () => {
      const mutualJobs = [
        { helpfulness_score: 5 },
        { helpfulness_score: 5 },
        { helpfulness_score: 5 },
      ]
      const mockEq = vi.fn().mockResolvedValue({ data: mutualJobs, error: null })
      const mockOr = vi.fn().mockReturnValue({ eq: mockEq })
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await service.detectCollusion(
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
      )

      expect(result.flagged).toBe(false)
    })

    it('returns flagged=true when >3 mutual jobs with avg rating >4.5', async () => {
      const mutualJobs = [
        { helpfulness_score: 5 },
        { helpfulness_score: 5 },
        { helpfulness_score: 5 },
        { helpfulness_score: 5 },
      ]
      const mockEq = vi.fn().mockResolvedValue({ data: mutualJobs, error: null })
      const mockOr = vi.fn().mockReturnValue({ eq: mockEq })
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await service.detectCollusion(
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
      )

      expect(result.flagged).toBe(true)
      expect(result.mutual_jobs).toBe(4)
      expect(result.avg_mutual_rating).toBe(5)
    })

    it('returns flagged=false when >3 mutual jobs but avg rating <=4.5', async () => {
      const mutualJobs = [
        { helpfulness_score: 3 },
        { helpfulness_score: 4 },
        { helpfulness_score: 4 },
        { helpfulness_score: 5 },
      ]
      const mockEq = vi.fn().mockResolvedValue({ data: mutualJobs, error: null })
      const mockOr = vi.fn().mockReturnValue({ eq: mockEq })
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      const result = await service.detectCollusion(
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
      )

      expect(result.flagged).toBe(false)
      expect(result.mutual_jobs).toBe(4)
      expect(result.avg_mutual_rating).toBe(4)
    })

    it('throws when agent ID format is invalid (injection prevention)', async () => {
      await expect(service.detectCollusion('not-a-uuid', '00000000-0000-0000-0000-000000000002'))
        .rejects.toThrow('Invalid agent ID format')

      await expect(service.detectCollusion('00000000-0000-0000-0000-000000000001', 'DROP TABLE agents'))
        .rejects.toThrow('Invalid agent ID format')
    })

    it('throws when supabase query fails', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
      const mockOr = vi.fn().mockReturnValue({ eq: mockEq })
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr })
      mockSupabase.from.mockReturnValue({ select: mockSelect })

      await expect(service.detectCollusion(
        '00000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
      )).rejects.toThrow('DB error')
    })
  })
})
