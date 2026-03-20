import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/utils/logger', () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import { JobService } from './job.service'

function createMockSupabase() {
  return {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'job-1', status: 'open' }, error: null })) })) })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'job-1', status: 'open', client_agent_id: 'a1', service_agent_id: null, zone: 'starter' }, error: null })),
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null, count: 0 })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null, count: 0 })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => ({ data: { id: 'job-1', status: 'accepted' }, error: null })),
            })),
          })),
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: { id: 'job-1', status: 'submitted' }, error: null })),
          })),
        })),
      })),
    })),
    rpc: vi.fn(() => ({ data: { status: 'locked' }, error: null })),
  } as any
}

describe('JobService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let service: JobService

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    service = new JobService(mockSupabase)
  })

  it('should instantiate', () => {
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    expect(typeof service.createJob).toBe('function')
    expect(typeof service.getJob).toBe('function')
    expect(typeof service.listJobs).toBe('function')
    expect(typeof service.acceptJob).toBe('function')
    expect(typeof service.submitJob).toBe('function')
    expect(typeof service.rateJob).toBe('function')
  })

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
      ['open', 'submitted'],
      ['open', 'under_review'],
      ['open', 'disputed'],
      ['accepted', 'completed'],
      ['accepted', 'submitted'],
      ['accepted', 'open'],
      ['in_progress', 'accepted'],
      ['in_progress', 'open'],
      ['in_progress', 'completed'],
      ['in_progress', 'cancelled'],
      ['submitted', 'open'],
      ['submitted', 'accepted'],
      ['submitted', 'completed'],
      ['submitted', 'cancelled'],
      ['under_review', 'open'],
      ['under_review', 'accepted'],
      ['under_review', 'cancelled'],
      ['completed', 'open'],
      ['completed', 'accepted'],
      ['completed', 'cancelled'],
      ['completed', 'disputed'],
      ['cancelled', 'open'],
      ['cancelled', 'accepted'],
      ['cancelled', 'in_progress'],
      ['cancelled', 'completed'],
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

  describe('validateTransition - terminal states have no valid targets', () => {
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
  })

  describe('validateTransition - unknown status', () => {
    it('throws for unknown current status', () => {
      expect(() => (service as any).validateTransition('unknown_status', 'open')).toThrow('Invalid transition')
    })
  })
})
