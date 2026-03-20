import { describe, it, expect, vi } from 'vitest'
import { ModerationService } from './moderation.service'

const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'd-1', status: 'open' }, error: null })) })) })),
    update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null, select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'd-1' }, error: null })) })) })) })),
    select: vi.fn(() => ({
      or: vi.fn(() => ({
        eq: vi.fn(() => ({ data: [], error: null })),
      })),
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null, count: 0 })),
        })),
      })),
    })),
  })),
} as any

describe('ModerationService', () => {
  it('should instantiate', () => {
    const service = new ModerationService(mockSupabase)
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    const service = new ModerationService(mockSupabase)
    expect(typeof service.createDispute).toBe('function')
    expect(typeof service.listDisputes).toBe('function')
    expect(typeof service.resolveDispute).toBe('function')
    expect(typeof service.issueSanction).toBe('function')
    expect(typeof service.detectCollusion).toBe('function')
  })
})
