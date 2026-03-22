import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock all middleware to pass-through
vi.mock('@/lib/middleware/auth', () => ({
  withAuth: (handler: any) => handler,
}))
vi.mock('@/lib/middleware/rate-limit', () => ({
  withRateLimit: (handler: any) => handler,
}))
vi.mock('@/lib/middleware/feature-toggle', () => ({
  withFeatureToggle: (_name: string, handler: any) => handler,
}))

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn().mockResolvedValue({}),
}))

// Mock WebhookService
const mockDeleteSubscription = vi.fn()
vi.mock('@/lib/services/webhook.service', () => ({
  WebhookService: vi.fn().mockImplementation(() => ({
    deleteSubscription: mockDeleteSubscription,
  })),
}))

import { DELETE } from '../route'

function makeRequest(
  method: string,
  subscriptionId: string,
  headers: Record<string, string> = {}
) {
  const reqHeaders = new Headers(headers)
  return new NextRequest(`http://localhost/api/v1/webhooks/subscriptions/${subscriptionId}`, {
    method,
    headers: reqHeaders,
  })
}

describe('DELETE /api/v1/webhooks/subscriptions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no agent ID header', async () => {
    const res = await DELETE(makeRequest('DELETE', 'sub-1'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('deletes subscription successfully', async () => {
    mockDeleteSubscription.mockResolvedValue({ deleted: true })

    const res = await DELETE(makeRequest('DELETE', 'sub-1', { 'x-agent-id': 'agent-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({ deleted: true })
    expect(body.error).toBeNull()
    expect(mockDeleteSubscription).toHaveBeenCalledWith('agent-1', 'sub-1')
  })

  it('returns 500 when service throws', async () => {
    mockDeleteSubscription.mockRejectedValue(new Error('Not found'))

    const res = await DELETE(makeRequest('DELETE', 'sub-1', { 'x-agent-id': 'agent-1' }))

    const body = await res.json()
    expect(body.error).toBeTruthy()
    expect(body.data).toBeNull()
  })
})
