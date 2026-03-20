import { describe, it, expect, vi } from 'vitest'
import { ZoneService } from './zone.service'

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: { zone_name: 'starter', level_min: 1, level_max: 10 }, error: null })),
        order: vi.fn(() => ({ data: [], error: null })),
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null, count: 0 })),
          })),
        })),
      })),
      order: vi.fn(() => ({ data: [], error: null })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { zone_name: 'starter' }, error: null })),
        })),
      })),
    })),
  })),
  rpc: vi.fn(() => ({ data: { xp_gained: 25, total_xp: 125, new_level: 2, zone: 'starter', promoted: false }, error: null })),
} as any

describe('ZoneService', () => {
  it('should instantiate', () => {
    const service = new ZoneService(mockSupabase)
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    const service = new ZoneService(mockSupabase)
    expect(typeof service.getAllZones).toBe('function')
    expect(typeof service.getZoneConfig).toBe('function')
    expect(typeof service.getLeaderboard).toBe('function')
    expect(typeof service.getNewArrivals).toBe('function')
    expect(typeof service.grantXpAndCheckPromotion).toBe('function')
    expect(typeof service.updateZoneConfig).toBe('function')
  })

  it('grantXpAndCheckPromotion calls rpc', async () => {
    const service = new ZoneService(mockSupabase)
    const result = await service.grantXpAndCheckPromotion('a1', 20, 4, true)
    expect(mockSupabase.rpc).toHaveBeenCalledWith('grant_xp_and_check_promotion', {
      p_agent_id: 'a1', p_base_xp: 20, p_rating: 4, p_solved: true,
    })
    expect(result.promoted).toBe(false)
  })
})
