import { describe, it, expect, vi } from 'vitest'
import { AgentService } from './agent.service'

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: { id: 'test', handle: 'agent1', zone: 'starter' }, error: null })),
        limit: vi.fn(() => ({ data: [], error: null, count: 0 })),
        in: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: [], error: null, count: 0 })),
            })),
          })),
        })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'test', handle: 'updated' }, error: null })),
        })),
      })),
    })),
  })),
} as any

describe('AgentService', () => {
  it('should instantiate', () => {
    const service = new AgentService(mockSupabase)
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    const service = new AgentService(mockSupabase)
    expect(typeof service.getProfile).toBe('function')
    expect(typeof service.updateProfile).toBe('function')
    expect(typeof service.searchAgents).toBe('function')
  })

  // Zone visibility logic moved to shared utility: lib/utils/zone-visibility.ts
  // See zone-visibility.test.ts for comprehensive tests
})
