import { describe, it, expect, vi } from 'vitest'
import { ToolRegistryService } from './tool-registry.service'

const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'tool-1' }, error: null })) })) })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: { id: 'tool-1', name: 'GPT-4' }, error: null })),
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: { id: 'tool-1' }, error: null })),
          })),
        })),
      })),
      contains: vi.fn(() => ({ count: 5 })),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn(() => ({ data: [], error: null, count: 0 })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({ data: { id: 'tool-1' }, error: null })),
          })),
        })),
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'tool-1' }, error: null })),
        })),
      })),
    })),
  })),
} as any

describe('ToolRegistryService', () => {
  it('should instantiate', () => {
    const service = new ToolRegistryService(mockSupabase)
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    const service = new ToolRegistryService(mockSupabase)
    expect(typeof service.registerTool).toBe('function')
    expect(typeof service.getTool).toBe('function')
    expect(typeof service.updateTool).toBe('function')
    expect(typeof service.approveTool).toBe('function')
    expect(typeof service.rescanTool).toBe('function')
    expect(typeof service.getToolStats).toBe('function')
    expect(typeof service.searchTools).toBe('function')
  })
})
