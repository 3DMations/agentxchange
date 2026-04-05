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

// Mock JobService
const mockCreateJob = vi.fn()
vi.mock('@/lib/services/job.service', () => ({
  JobService: class {
    createJob = mockCreateJob
  },
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
  return new NextRequest('http://localhost/api/v1/a2a/tasks', {
    method: 'POST',
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })
}

const validBody = {
  agent_id: '550e8400-e29b-41d4-a716-446655440000',
  description: 'Build a REST API for managing inventory items',
  point_budget: 100,
  acceptance_criteria: 'Must include CRUD endpoints with tests and documentation',
}

describe('POST /api/v1/a2a/tasks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no agent ID header', async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  it('returns 400 for invalid body (missing description)', async () => {
    const res = await POST(makeRequest(
      { agent_id: '550e8400-e29b-41d4-a716-446655440000', point_budget: 100, acceptance_criteria: 'Must include tests and docs' },
      { 'x-agent-id': 'agent-1' }
    ))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for invalid body (description too short)', async () => {
    const res = await POST(makeRequest(
      { ...validBody, description: 'short' },
      { 'x-agent-id': 'agent-1' }
    ))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid body (invalid agent_id format)', async () => {
    const res = await POST(makeRequest(
      { ...validBody, agent_id: 'not-a-uuid' },
      { 'x-agent-id': 'agent-1' }
    ))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid body (zero point_budget)', async () => {
    const res = await POST(makeRequest(
      { ...validBody, point_budget: 0 },
      { 'x-agent-id': 'agent-1' }
    ))
    expect(res.status).toBe(400)
  })

  it('creates task successfully', async () => {
    const mockJob = {
      id: 'job-1',
      client_agent_id: 'agent-1',
      status: 'open',
      description: validBody.description,
      acceptance_criteria: validBody.acceptance_criteria,
      point_budget: 100,
      created_at: '2026-03-21T00:00:00Z',
    }
    mockCreateJob.mockResolvedValue(mockJob)

    const res = await POST(makeRequest(validBody, { 'x-agent-id': 'agent-1' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.id).toBe('job-1')
    expect(body.data.status).toBe('submitted') // A2A mapping: open -> submitted
    expect(body.data.description).toBe(validBody.description)
    expect(body.data.point_budget).toBe(100)
    expect(body.error).toBeNull()

    expect(mockCreateJob).toHaveBeenCalledWith('agent-1', {
      description: validBody.description,
      acceptance_criteria: validBody.acceptance_criteria,
      point_budget: 100,
    })
  })

  it('returns 500 when service throws', async () => {
    mockCreateJob.mockRejectedValue(new Error('DB failure'))

    const res = await POST(makeRequest(validBody, { 'x-agent-id': 'agent-1' }))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL')
    expect(body.error.message).toBe('An unexpected error occurred')
  })
})
