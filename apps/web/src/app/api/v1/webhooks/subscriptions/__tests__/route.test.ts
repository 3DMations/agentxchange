import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock all middleware to pass-through
vi.mock('@/lib/middleware/auth', () => ({
  withAuth: (handler: any) => handler,
}))
vi.mock('@/lib/middleware/rate-limit', () => ({
  withRateLimit: (handler: any) => handler,
}))
vi.mock('@/lib/middleware/idempotency', () => ({
  withIdempotency: (handler: any) => handler,
}))
vi.mock('@/lib/middleware/feature-toggle', () => ({
  withFeatureToggle: (_name: string, handler: any) => handler,
}))

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn().mockResolvedValue({}),
}))

// Mock WebhookService
const mockCreateSubscription = vi.fn()
const mockListSubscriptions = vi.fn()
vi.mock('@/lib/services/webhook.service', () => ({
  WebhookService: vi.fn().mockImplementation(() => ({
    createSubscription: mockCreateSubscription,
    listSubscriptions: mockListSubscriptions,
  })),
}))

import { POST, GET } from '../route'

function makeRequest(
  method: string,
  body?: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  const reqHeaders = new Headers(headers)
  if (body) {
    reqHeaders.set('content-type', 'application/json')
  }
  return new NextRequest('http://localhost/api/v1/webhooks/subscriptions', {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('POST /api/v1/webhooks/subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no agent ID header', async () => {
    const res = await POST(makeRequest('POST', {
      url: 'https://example.com/hook',
      event_types: ['job_accepted'],
    }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 400 for invalid body (missing url)', async () => {
    const res = await POST(makeRequest('POST', {
      event_types: ['job_accepted'],
    }, { 'x-agent-id': 'agent-1' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for invalid body (empty event_types)', async () => {
    const res = await POST(makeRequest('POST', {
      url: 'https://example.com/hook',
      event_types: [],
    }, { 'x-agent-id': 'agent-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid body (bad url)', async () => {
    const res = await POST(makeRequest('POST', {
      url: 'not-a-url',
      event_types: ['job_accepted'],
    }, { 'x-agent-id': 'agent-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid event type', async () => {
    const res = await POST(makeRequest('POST', {
      url: 'https://example.com/hook',
      event_types: ['invalid_event'],
    }, { 'x-agent-id': 'agent-1' }))
    expect(res.status).toBe(400)
  })

  it('creates subscription successfully', async () => {
    const mockSub = {
      id: 'sub-1',
      agent_id: 'agent-1',
      url: 'https://example.com/hook',
      events: ['job_accepted', 'job_submitted'],
      secret: 'secret-123',
      active: true,
      created_at: '2026-01-01T00:00:00Z',
    }
    mockCreateSubscription.mockResolvedValue(mockSub)

    const res = await POST(makeRequest('POST', {
      url: 'https://example.com/hook',
      event_types: ['job_accepted', 'job_submitted'],
    }, { 'x-agent-id': 'agent-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(mockSub)
    expect(body.error).toBeNull()
    expect(mockCreateSubscription).toHaveBeenCalledWith('agent-1', {
      url: 'https://example.com/hook',
      events: ['job_accepted', 'job_submitted'],
    })
  })

  it('returns 500 when service throws', async () => {
    mockCreateSubscription.mockRejectedValue(new Error('DB failure'))

    const res = await POST(makeRequest('POST', {
      url: 'https://example.com/hook',
      event_types: ['job_accepted'],
    }, { 'x-agent-id': 'agent-1' }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL')
    expect(body.error.message).toBe('DB failure')
  })
})

describe('GET /api/v1/webhooks/subscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no agent ID header', async () => {
    const res = await GET(makeRequest('GET'))
    expect(res.status).toBe(401)
  })

  it('returns subscriptions for the agent', async () => {
    const mockSubs = [
      { id: 'sub-1', agent_id: 'agent-1', url: 'https://example.com/hook', events: ['job_accepted'] },
      { id: 'sub-2', agent_id: 'agent-1', url: 'https://example.com/hook2', events: ['rating_posted'] },
    ]
    mockListSubscriptions.mockResolvedValue(mockSubs)

    const res = await GET(makeRequest('GET', undefined, { 'x-agent-id': 'agent-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(mockSubs)
    expect(body.error).toBeNull()
    expect(mockListSubscriptions).toHaveBeenCalledWith('agent-1')
  })

  it('returns empty array when no subscriptions', async () => {
    mockListSubscriptions.mockResolvedValue([])

    const res = await GET(makeRequest('GET', undefined, { 'x-agent-id': 'agent-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
  })

  it('returns 500 when service throws', async () => {
    mockListSubscriptions.mockRejectedValue(new Error('Connection lost'))

    const res = await GET(makeRequest('GET', undefined, { 'x-agent-id': 'agent-1' }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL')
    expect(body.error.message).toBe('Connection lost')
  })
})
