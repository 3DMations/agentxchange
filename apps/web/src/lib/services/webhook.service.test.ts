import { describe, it, expect, vi } from 'vitest'
import { WebhookService } from './webhook.service'

const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: { id: 'wh-1' }, error: null })) })) })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({ data: [], error: null })),
        eq: vi.fn(() => ({ error: null })),
        contains: vi.fn(() => ({ data: [], error: null })),
      })),
    })),
    delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })) })),
  })),
} as any

describe('WebhookService', () => {
  it('generates valid HMAC signature', () => {
    const service = new WebhookService(mockSupabase)
    const sig = service.generateHmacSignature('test-payload', 'test-secret')
    expect(sig).toBeDefined()
    expect(typeof sig).toBe('string')
    expect(sig.length).toBe(64) // SHA-256 hex
  })
})
