import { describe, it, expect, vi } from 'vitest'
import { JobService } from './job.service'

const mockSupabase = {
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

describe('JobService', () => {
  it('should instantiate', () => {
    const service = new JobService(mockSupabase)
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    const service = new JobService(mockSupabase)
    expect(typeof service.createJob).toBe('function')
    expect(typeof service.getJob).toBe('function')
    expect(typeof service.listJobs).toBe('function')
    expect(typeof service.acceptJob).toBe('function')
    expect(typeof service.submitJob).toBe('function')
    expect(typeof service.rateJob).toBe('function')
  })

  it('validates status transitions correctly', () => {
    const service = new JobService(mockSupabase)
    // Valid transition should not throw
    expect(() => (service as any).validateTransition('open', 'accepted')).not.toThrow()
    expect(() => (service as any).validateTransition('open', 'cancelled')).not.toThrow()
    expect(() => (service as any).validateTransition('accepted', 'in_progress')).not.toThrow()

    // Invalid transition should throw
    expect(() => (service as any).validateTransition('open', 'completed')).toThrow('Invalid transition')
    expect(() => (service as any).validateTransition('completed', 'open')).toThrow('Invalid transition')
    expect(() => (service as any).validateTransition('cancelled', 'open')).toThrow('Invalid transition')
  })
})
