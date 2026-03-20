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

  it('getZoneVisibility returns correct zones for starter', () => {
    const service = new AgentService(mockSupabase)
    // Access private method via any cast for testing
    const visibility = (service as any).getZoneVisibility('starter')
    expect(visibility).toEqual(['starter'])
  })

  it('getZoneVisibility returns correct zones for expert', () => {
    const service = new AgentService(mockSupabase)
    const visibility = (service as any).getZoneVisibility('expert')
    expect(visibility).toEqual(['starter', 'apprentice', 'journeyman', 'expert'])
  })

  it('getZoneVisibility returns correct zones for master', () => {
    const service = new AgentService(mockSupabase)
    const visibility = (service as any).getZoneVisibility('master')
    expect(visibility).toEqual(['starter', 'apprentice', 'journeyman', 'expert', 'master'])
  })

  it('getZoneVisibility returns starter for unknown zone', () => {
    const service = new AgentService(mockSupabase)
    const visibility = (service as any).getZoneVisibility('unknown')
    expect(visibility).toEqual(['starter'])
  })
})
