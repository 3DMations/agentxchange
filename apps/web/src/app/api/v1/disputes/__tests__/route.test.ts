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

// Mock error sanitizer to return a 500 response
vi.mock('@/lib/utils/error-sanitizer', async () => {
  const { NextResponse } = await import('next/server')
  return {
    handleRouteError: () =>
      NextResponse.json(
        { data: null, error: { code: 'INTERNAL', message: 'An unexpected error occurred' }, meta: {} },
        { status: 500 }
      ),
  }
})

// Mock ModerationService
const mockCreateDispute = vi.fn()
const mockListDisputes = vi.fn()
vi.mock('@/lib/services/moderation.service', () => ({
  ModerationService: vi.fn().mockImplementation(() => ({
    createDispute: mockCreateDispute,
    listDisputes: mockListDisputes,
  })),
}))

import { POST, GET } from '../route'

function makeRequest(
  method: string,
  body?: Record<string, unknown>,
  headers: Record<string, string> = {},
  searchParams?: Record<string, string>
) {
  const reqHeaders = new Headers(headers)
  if (body) {
    reqHeaders.set('content-type', 'application/json')
  }
  let url = 'http://localhost/api/v1/disputes'
  if (searchParams) {
    const params = new URLSearchParams(searchParams)
    url += `?${params.toString()}`
  }
  return new NextRequest(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })
}

const validDisputeBody = {
  job_id: '550e8400-e29b-41d4-a716-446655440000',
  reason: 'The deliverable did not meet the acceptance criteria outlined in the job.',
  evidence: 'See attached screenshots and diff comparison.',
}

describe('POST /api/v1/disputes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no agent ID header', async () => {
    const res = await POST(makeRequest('POST', validDisputeBody))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 400 for missing job_id', async () => {
    const res = await POST(
      makeRequest(
        'POST',
        { reason: 'The deliverable was wrong in every way possible' },
        { 'x-agent-id': 'agent-1' }
      )
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for reason too short', async () => {
    const res = await POST(
      makeRequest(
        'POST',
        { job_id: '550e8400-e29b-41d4-a716-446655440000', reason: 'bad' },
        { 'x-agent-id': 'agent-1' }
      )
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for non-uuid job_id', async () => {
    const res = await POST(
      makeRequest(
        'POST',
        { job_id: 'not-a-uuid', reason: 'The deliverable was wrong in every way possible' },
        { 'x-agent-id': 'agent-1' }
      )
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('creates a dispute successfully', async () => {
    const mockDispute = {
      id: 'dispute-1',
      job_id: validDisputeBody.job_id,
      filed_by: 'agent-1',
      reason: validDisputeBody.reason,
      evidence: validDisputeBody.evidence,
      status: 'open',
      priority: 'normal',
      created_at: '2026-03-22T00:00:00Z',
    }
    mockCreateDispute.mockResolvedValue(mockDispute)

    const res = await POST(
      makeRequest('POST', validDisputeBody, { 'x-agent-id': 'agent-1' })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(mockDispute)
    expect(body.error).toBeNull()
    expect(mockCreateDispute).toHaveBeenCalledWith('agent-1', {
      job_id: validDisputeBody.job_id,
      reason: validDisputeBody.reason,
      evidence: validDisputeBody.evidence,
    })
  })

  it('creates a dispute without optional evidence', async () => {
    const mockDispute = {
      id: 'dispute-2',
      job_id: validDisputeBody.job_id,
      filed_by: 'agent-1',
      reason: validDisputeBody.reason,
      status: 'open',
      priority: 'normal',
      created_at: '2026-03-22T00:00:00Z',
    }
    mockCreateDispute.mockResolvedValue(mockDispute)

    const { evidence, ...bodyWithoutEvidence } = validDisputeBody
    const res = await POST(
      makeRequest('POST', bodyWithoutEvidence, { 'x-agent-id': 'agent-1' })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(mockDispute)
  })

  it('returns 500 when service throws', async () => {
    mockCreateDispute.mockRejectedValue(new Error('DB failure'))

    const res = await POST(
      makeRequest('POST', validDisputeBody, { 'x-agent-id': 'agent-1' })
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL')
    expect(body.error.message).toBe('An unexpected error occurred')
  })
})

describe('GET /api/v1/disputes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns disputes with default params', async () => {
    const mockResult = {
      disputes: [
        { id: 'dispute-1', status: 'open', priority: 'normal' },
        { id: 'dispute-2', status: 'in_review', priority: 'high' },
      ],
      cursor_next: 'cursor-xyz',
      total: 15,
    }
    mockListDisputes.mockResolvedValue(mockResult)

    const res = await GET(
      makeRequest('GET', undefined, { 'x-agent-id': 'agent-1' })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(mockResult.disputes)
    expect(body.meta.cursor_next).toBe('cursor-xyz')
    expect(body.meta.total).toBe(15)
    expect(mockListDisputes).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20 }),
      'agent-1'
    )
  })

  it('filters by status and priority', async () => {
    mockListDisputes.mockResolvedValue({ disputes: [], cursor_next: null, total: 0 })

    const res = await GET(
      makeRequest('GET', undefined, { 'x-agent-id': 'agent-1' }, {
        status: 'open',
        priority: 'critical',
        limit: '5',
      })
    )

    expect(res.status).toBe(200)
    expect(mockListDisputes).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'open', priority: 'critical', limit: 5 }),
      'agent-1'
    )
  })

  it('returns 400 for invalid status value', async () => {
    const res = await GET(
      makeRequest('GET', undefined, { 'x-agent-id': 'agent-1' }, { status: 'bogus' })
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for invalid priority value', async () => {
    const res = await GET(
      makeRequest('GET', undefined, { 'x-agent-id': 'agent-1' }, { priority: 'mega' })
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns empty array when no disputes', async () => {
    mockListDisputes.mockResolvedValue({ disputes: [], cursor_next: null, total: 0 })

    const res = await GET(
      makeRequest('GET', undefined, { 'x-agent-id': 'agent-1' })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
  })

  it('returns 500 when service throws', async () => {
    mockListDisputes.mockRejectedValue(new Error('Connection lost'))

    const res = await GET(
      makeRequest('GET', undefined, { 'x-agent-id': 'agent-1' })
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL')
  })
})
