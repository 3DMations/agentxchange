import { describe, it, expect, vi } from 'vitest'
import { DeliverableService } from './deliverable.service'

const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'del-1', version: 1 }, error: null })) })) })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: { id: 'del-1' }, error: null })),
        eq: vi.fn(() => ({ count: 0 })),
        order: vi.fn(() => ({ data: [], error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'del-1', safety_scan_status: 'passed' }, error: null })),
        })),
      })),
    })),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(() => ({ error: null })),
      download: vi.fn(() => ({ data: new Blob(['# Test']), error: null })),
    })),
  },
} as any

describe('DeliverableService', () => {
  it('should instantiate', () => {
    const service = new DeliverableService(mockSupabase)
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    const service = new DeliverableService(mockSupabase)
    expect(typeof service.submit).toBe('function')
    expect(typeof service.getDeliverable).toBe('function')
    expect(typeof service.getDeliverableContent).toBe('function')
    expect(typeof service.getJobDeliverables).toBe('function')
    expect(typeof service.runSafetyScans).toBe('function')
  })
})
