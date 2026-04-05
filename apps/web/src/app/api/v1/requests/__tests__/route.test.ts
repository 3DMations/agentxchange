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
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {},
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

// Mock JobService — must use a regular function (not arrow) so `new` works in Vitest 4
const mockCreateJob = vi.fn()
const mockListJobs = vi.fn()
vi.mock('@/lib/services/job.service', () => ({
  JobService: vi.fn().mockImplementation(function (this: any) {
    this.createJob = mockCreateJob
    this.listJobs = mockListJobs
  }),
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
  let url = 'http://localhost/api/v1/requests'
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

const validJobBody = {
  description: 'Build a data pipeline for CSV ingestion',
  acceptance_criteria: 'Must handle 1M rows in under 60 seconds',
  point_budget: 100,
  required_skills: ['python', 'data-engineering'],
}

describe('POST /api/v1/requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no agent ID header', async () => {
    const res = await POST(makeRequest('POST', validJobBody))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 400 for invalid body (missing description)', async () => {
    const res = await POST(
      makeRequest(
        'POST',
        { acceptance_criteria: 'Must work correctly', point_budget: 50 },
        { 'x-agent-id': 'agent-1' }
      )
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for invalid body (description too short)', async () => {
    const res = await POST(
      makeRequest(
        'POST',
        { description: 'short', acceptance_criteria: 'Must work correctly', point_budget: 50 },
        { 'x-agent-id': 'agent-1' }
      )
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for invalid body (point_budget < 1)', async () => {
    const res = await POST(
      makeRequest(
        'POST',
        {
          description: 'Build a data pipeline for CSV ingestion',
          acceptance_criteria: 'Must handle rows correctly',
          point_budget: 0,
        },
        { 'x-agent-id': 'agent-1' }
      )
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('creates a job successfully', async () => {
    const mockJob = {
      id: 'job-1',
      requester_id: 'agent-1',
      description: validJobBody.description,
      acceptance_criteria: validJobBody.acceptance_criteria,
      point_budget: 100,
      status: 'open',
      created_at: '2026-03-22T00:00:00Z',
    }
    mockCreateJob.mockResolvedValue(mockJob)

    const res = await POST(
      makeRequest('POST', validJobBody, { 'x-agent-id': 'agent-1' })
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(mockJob)
    expect(body.error).toBeNull()
    expect(mockCreateJob).toHaveBeenCalledWith('agent-1', {
      description: validJobBody.description,
      acceptance_criteria: validJobBody.acceptance_criteria,
      point_budget: 100,
      required_skills: ['python', 'data-engineering'],
    })
  })

  it('returns 500 when service throws', async () => {
    mockCreateJob.mockRejectedValue(new Error('DB failure'))

    const res = await POST(
      makeRequest('POST', validJobBody, { 'x-agent-id': 'agent-1' })
    )

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL')
    expect(body.error.message).toBe('An unexpected error occurred')
  })
})

describe('GET /api/v1/requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns jobs with default params', async () => {
    const mockResult = {
      jobs: [
        { id: 'job-1', status: 'open', point_budget: 100 },
        { id: 'job-2', status: 'open', point_budget: 200 },
      ],
      cursor_next: 'cursor-abc',
      total: 42,
    }
    mockListJobs.mockResolvedValue(mockResult)

    const res = await GET(makeRequest('GET'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual(mockResult.jobs)
    expect(body.meta.cursor_next).toBe('cursor-abc')
    expect(body.meta.total).toBe(42)
    expect(mockListJobs).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20 })
    )
  })

  it('filters by status query param', async () => {
    mockListJobs.mockResolvedValue({ jobs: [], cursor_next: null, total: 0 })

    const res = await GET(
      makeRequest('GET', undefined, {}, { status: 'accepted', limit: '10' })
    )

    expect(res.status).toBe(200)
    expect(mockListJobs).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted', limit: 10 })
    )
  })

  it('returns 400 for invalid status value', async () => {
    const res = await GET(
      makeRequest('GET', undefined, {}, { status: 'invalid_status' })
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns empty array when no jobs', async () => {
    mockListJobs.mockResolvedValue({ jobs: [], cursor_next: null, total: 0 })

    const res = await GET(makeRequest('GET'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
  })

  it('returns 500 when service throws', async () => {
    mockListJobs.mockRejectedValue(new Error('Connection lost'))

    const res = await GET(makeRequest('GET'))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL')
  })
})
