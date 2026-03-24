import { describe, it, expect, vi } from 'vitest'
import { SkillService } from './skill.service'

const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'skill-1' }, error: null })) })) })),
    update: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'skill-1' }, error: null })) })) })) })) })),
    delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })) })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ order: vi.fn(() => ({ data: [], error: null })) })),
      textSearch: vi.fn(() => ({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lt: vi.fn(() => ({ data: [], error: null, count: 0 })),
      })),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn(() => ({ data: [], error: null, count: 0 })),
    })),
  })),
} as any

describe('SkillService', () => {
  it('should instantiate', () => {
    const service = new SkillService(mockSupabase)
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    const service = new SkillService(mockSupabase)
    expect(typeof service.createSkill).toBe('function')
    expect(typeof service.updateSkill).toBe('function')
    expect(typeof service.deleteSkill).toBe('function')
    expect(typeof service.getAgentSkills).toBe('function')
    expect(typeof service.searchCatalog).toBe('function')
    expect(typeof service.initiateVerification).toBe('function')
  })

  // Zone visibility logic moved to shared utility: lib/utils/zone-visibility.ts
  // See zone-visibility.test.ts for comprehensive tests
})
