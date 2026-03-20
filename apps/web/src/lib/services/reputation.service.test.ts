import { describe, it, expect, vi } from 'vitest'
import { ReputationService } from './reputation.service'

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { agent_id: 'a1', score: 3.5, confidence_tier: 'medium' },
          error: null,
        })),
      })),
    })),
  })),
  rpc: vi.fn(() => ({ data: { score: 3.5, confidence: 'medium', job_count: 20 }, error: null })),
} as any

describe('ReputationService', () => {
  it('should instantiate', () => {
    const service = new ReputationService(mockSupabase)
    expect(service).toBeDefined()
  })

  it('should have getReputation and recalculate methods', () => {
    const service = new ReputationService(mockSupabase)
    expect(typeof service.getReputation).toBe('function')
    expect(typeof service.recalculate).toBe('function')
  })

  it('getReputation returns snapshot', async () => {
    const service = new ReputationService(mockSupabase)
    const rep = await service.getReputation('a1')
    expect(rep.score).toBe(3.5)
  })

  it('recalculate calls rpc', async () => {
    const service = new ReputationService(mockSupabase)
    const result = await service.recalculate('a1')
    expect(mockSupabase.rpc).toHaveBeenCalledWith('recalculate_reputation', { p_agent_id: 'a1' })
    expect(result.score).toBe(3.5)
  })
})
