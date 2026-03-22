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
const mockGetJob = vi.fn()
const mockAcceptJob = vi.fn()
const mockSubmitJob = vi.fn()
vi.mock('@/lib/services/job.service', () => ({
  JobService: vi.fn().mockImplementation(() => ({
    getJob: mockGetJob,
    acceptJob: mockAcceptJob,
    submitJob: mockSubmitJob,
  })),
}))

import { GET } from '../route'

// Import accept and submit routes
import { POST as AcceptPOST } from '../accept/route'
import { POST as SubmitPOST } from '../submit/route'

function makeGetRequest(taskId: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost/api/v1/a2a/tasks/${taskId}`, {
    method: 'GET',
    headers: new Headers(headers),
  })
}

function makePostRequest(
  taskId: string,
  path: string,
  body?: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  const reqHeaders = new Headers(headers)
  if (body) {
    reqHeaders.set('content-type', 'application/json')
  }
  return new NextRequest(`http://localhost/api/v1/a2a/tasks/${taskId}/${path}`, {
    method: 'POST',
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })
}

const mockJob = {
  id: 'job-1',
  client_agent_id: 'agent-1',
  service_agent_id: null,
  status: 'open',
  description: 'Build a REST API for managing items',
  acceptance_criteria: 'Must include CRUD endpoints with tests',
  point_budget: 100,
  point_quote: null,
  zone_at_creation: 'starter',
  tools_used: [],
  created_at: '2026-03-21T00:00:00Z',
  accepted_at: null,
  submitted_at: null,
  reviewed_at: null,
}

describe('GET /api/v1/a2a/tasks/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns task status successfully', async () => {
    mockGetJob.mockResolvedValue(mockJob)

    const res = await GET(makeGetRequest('job-1', { 'x-agent-id': 'agent-1' }))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.id).toBe('job-1')
    expect(body.data.status).toBe('submitted') // open -> submitted in A2A
    expect(body.data.agent_id).toBe('agent-1')
    expect(body.data.updated_at).toBeNull()
    expect(body.error).toBeNull()
  })

  it('maps accepted status to working', async () => {
    mockGetJob.mockResolvedValue({
      ...mockJob,
      status: 'accepted',
      accepted_at: '2026-03-21T01:00:00Z',
    })

    const res = await GET(makeGetRequest('job-1', { 'x-agent-id': 'agent-1' }))
    const body = await res.json()
    expect(body.data.status).toBe('working')
    expect(body.data.updated_at).toBe('2026-03-21T01:00:00Z')
  })

  it('maps in_progress status to working', async () => {
    mockGetJob.mockResolvedValue({ ...mockJob, status: 'in_progress', accepted_at: '2026-03-21T01:00:00Z' })

    const res = await GET(makeGetRequest('job-1', { 'x-agent-id': 'agent-1' }))
    const body = await res.json()
    expect(body.data.status).toBe('working')
  })

  it('maps submitted status to input-required', async () => {
    mockGetJob.mockResolvedValue({
      ...mockJob,
      status: 'submitted',
      submitted_at: '2026-03-21T02:00:00Z',
    })

    const res = await GET(makeGetRequest('job-1', { 'x-agent-id': 'agent-1' }))
    const body = await res.json()
    expect(body.data.status).toBe('input-required')
  })

  it('maps completed status to completed', async () => {
    mockGetJob.mockResolvedValue({ ...mockJob, status: 'completed', reviewed_at: '2026-03-21T03:00:00Z' })

    const res = await GET(makeGetRequest('job-1', { 'x-agent-id': 'agent-1' }))
    const body = await res.json()
    expect(body.data.status).toBe('completed')
  })

  it('maps disputed status to failed', async () => {
    mockGetJob.mockResolvedValue({ ...mockJob, status: 'disputed' })

    const res = await GET(makeGetRequest('job-1', { 'x-agent-id': 'agent-1' }))
    const body = await res.json()
    expect(body.data.status).toBe('failed')
  })

  it('maps cancelled status to canceled', async () => {
    mockGetJob.mockResolvedValue({ ...mockJob, status: 'cancelled' })

    const res = await GET(makeGetRequest('job-1', { 'x-agent-id': 'agent-1' }))
    const body = await res.json()
    expect(body.data.status).toBe('canceled')
  })

  it('returns 500 when service throws', async () => {
    mockGetJob.mockRejectedValue(new Error('DB error'))

    const res = await GET(makeGetRequest('job-1', { 'x-agent-id': 'agent-1' }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error.code).toBe('INTERNAL')
  })
})

describe('POST /api/v1/a2a/tasks/[id]/accept', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no agent ID header', async () => {
    const res = await AcceptPOST(makePostRequest('job-1', 'accept', { point_quote: 80 }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid body', async () => {
    const res = await AcceptPOST(makePostRequest('job-1', 'accept', {}, { 'x-agent-id': 'agent-2' }))
    expect(res.status).toBe(400)
  })

  it('accepts task successfully', async () => {
    const acceptedJob = {
      ...mockJob,
      status: 'accepted',
      service_agent_id: 'agent-2',
      point_quote: 80,
      accepted_at: '2026-03-21T01:00:00Z',
    }
    mockAcceptJob.mockResolvedValue(acceptedJob)

    const res = await AcceptPOST(makePostRequest('job-1', 'accept', { point_quote: 80 }, {
      'x-agent-id': 'agent-2',
      'idempotency-key': 'idem-1',
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('working')
    expect(body.data.updated_at).toBe('2026-03-21T01:00:00Z')
    expect(body.error).toBeNull()
  })

  it('returns 500 when service throws', async () => {
    mockAcceptJob.mockRejectedValue(new Error('DB failure'))

    const res = await AcceptPOST(makePostRequest('job-1', 'accept', { point_quote: 80 }, {
      'x-agent-id': 'agent-2',
      'idempotency-key': 'idem-2',
    }))
    expect(res.status).toBe(500)
  })
})

describe('POST /api/v1/a2a/tasks/[id]/submit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no agent ID header', async () => {
    const res = await SubmitPOST(makePostRequest('job-1', 'submit', {
      deliverable_id: '550e8400-e29b-41d4-a716-446655440000',
    }))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid body (missing deliverable_id)', async () => {
    const res = await SubmitPOST(makePostRequest('job-1', 'submit', {}, { 'x-agent-id': 'agent-2' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid deliverable_id format', async () => {
    const res = await SubmitPOST(makePostRequest('job-1', 'submit', {
      deliverable_id: 'not-a-uuid',
    }, { 'x-agent-id': 'agent-2' }))
    expect(res.status).toBe(400)
  })

  it('submits task successfully', async () => {
    const submittedJob = {
      ...mockJob,
      status: 'submitted',
      service_agent_id: 'agent-2',
      submitted_at: '2026-03-21T02:00:00Z',
    }
    mockSubmitJob.mockResolvedValue(submittedJob)

    const res = await SubmitPOST(makePostRequest('job-1', 'submit', {
      deliverable_id: '550e8400-e29b-41d4-a716-446655440000',
    }, {
      'x-agent-id': 'agent-2',
      'idempotency-key': 'idem-3',
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('input-required') // submitted -> input-required
    expect(body.data.updated_at).toBe('2026-03-21T02:00:00Z')
    expect(body.error).toBeNull()
  })

  it('returns 500 when service throws', async () => {
    mockSubmitJob.mockRejectedValue(new Error('Not the assigned service agent'))

    const res = await SubmitPOST(makePostRequest('job-1', 'submit', {
      deliverable_id: '550e8400-e29b-41d4-a716-446655440000',
    }, {
      'x-agent-id': 'agent-2',
      'idempotency-key': 'idem-4',
    }))
    expect(res.status).toBe(500)
  })
})
