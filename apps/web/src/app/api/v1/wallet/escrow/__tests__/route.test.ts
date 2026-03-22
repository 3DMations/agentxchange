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

// Mock WalletService
const mockEscrowLock = vi.fn()
vi.mock('@/lib/services/wallet.service', () => ({
  WalletService: vi.fn().mockImplementation(() => ({
    escrowLock: mockEscrowLock,
  })),
}))

import { POST } from '../route'

function makeRequest(
  body?: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  const reqHeaders = new Headers(headers)
  if (body) {
    reqHeaders.set('content-type', 'application/json')
  }
  return new NextRequest('http://localhost/api/v1/wallet/escrow', {
    method: 'POST',
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })
}

const validEscrowBody = {
  job_id: '550e8400-e29b-41d4-a716-446655440000',
  amount: 100,
}

describe('POST /api/v1/wallet/escrow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no agent ID header', async () => {
    const res = await POST(makeRequest(validEscrowBody))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 400 for missing job_id', async () => {
    const res = await POST(
      makeRequest(
        { amount: 100 },
        { 'x-agent-id': 'agent-1', 'idempotency-key': 'key-1' }
      )
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for non-uuid job_id', async () => {
    const res = await POST(
      makeRequest(
        { job_id: 'not-a-uuid', amount: 100 },
        { 'x-agent-id': 'agent-1', 'idempotency-key': 'key-1' }
      )
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for amount less than 1', async () => {
    const res = await POST(
      makeRequest(
        { job_id: '550e8400-e29b-41d4-a716-446655440000', amount: 0 },
        { 'x-agent-id': 'agent-1', 'idempotency-key': 'key-1' }
      )
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for missing amount', async () => {
    const res = await POST(
      makeRequest(
        { job_id: '550e8400-e29b-41d4-a716-446655440000' },
        { 'x-agent-id': 'agent-1', 'idempotency-key': 'key-1' }
      )
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('locks escrow successfully', async () => {
    const mockResult = {
      ledger_entry_id: 'ledger-1',
      agent_id: 'agent-1',
      job_id: validEscrowBody.job_id,
      amount: 100,
      type: 'escrow_lock',
      created_at: '2026-03-22T00:00:00Z',
    }
    mockEscrowLock.mockResolvedValue(mockResult)

    const res = await POST(
      makeRequest(validEscrowBody, {
        'x-agent-id': 'agent-1',
        'idempotency-key': 'idem-123',
      })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(mockResult)
    expect(body.error).toBeNull()
    expect(mockEscrowLock).toHaveBeenCalledWith(
      'agent-1',
      validEscrowBody.job_id,
      100,
      'idem-123'
    )
  })

  it('returns 500 when service throws', async () => {
    mockEscrowLock.mockRejectedValue(new Error('DB failure'))

    const res = await POST(
      makeRequest(validEscrowBody, {
        'x-agent-id': 'agent-1',
        'idempotency-key': 'idem-456',
      })
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL')
    expect(body.error.message).toBe('An unexpected error occurred')
  })
})
