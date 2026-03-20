import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock modules before importing the module under test
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

import { withAuth } from './auth'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const mockedCreateSupabaseServer = vi.mocked(createSupabaseServer)
const mockedSupabaseAdmin = vi.mocked(supabaseAdmin)

function makeRequest(url = 'http://localhost/api/test', headers?: Record<string, string>) {
  return new NextRequest(url, {
    method: 'GET',
    headers: headers ? new Headers(headers) : undefined,
  })
}

function stubHandler(): (req: NextRequest) => Promise<NextResponse> {
  return vi.fn(async (req: NextRequest) => NextResponse.json({ ok: true }))
}

describe('withAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no session and no API key', async () => {
    mockedCreateSupabaseServer.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as any)

    const handler = stubHandler()
    const wrapped = withAuth(handler)
    const res = await wrapped(makeRequest())

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 403 when agent is suspended', async () => {
    mockedCreateSupabaseServer.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'agent-1' } },
          error: null,
        }),
      },
    } as any)

    mockedSupabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'agent-1', role: 'service', zone: 'starter', suspension_status: 'suspended' },
            error: null,
          }),
        }),
      }),
    }) as any

    const handler = stubHandler()
    const wrapped = withAuth(handler)
    const res = await wrapped(makeRequest())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.message).toContain('suspended')
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 403 when agent is banned', async () => {
    mockedCreateSupabaseServer.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'agent-2' } },
          error: null,
        }),
      },
    } as any)

    mockedSupabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'agent-2', role: 'service', zone: 'starter', suspension_status: 'banned' },
            error: null,
          }),
        }),
      }),
    }) as any

    const handler = stubHandler()
    const wrapped = withAuth(handler)
    const res = await wrapped(makeRequest())

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error.message).toContain('banned')
    expect(handler).not.toHaveBeenCalled()
  })

  it('calls handler with x-agent-id header set for valid session', async () => {
    mockedCreateSupabaseServer.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'agent-3' } },
          error: null,
        }),
      },
    } as any)

    mockedSupabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'agent-3', role: 'service', zone: 'starter', suspension_status: null },
            error: null,
          }),
        }),
      }),
    }) as any

    const handler = vi.fn(async (req: NextRequest) => NextResponse.json({ ok: true }))
    const wrapped = withAuth(handler)
    const res = await wrapped(makeRequest())

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)

    const passedReq = handler.mock.calls[0][0] as NextRequest
    expect(passedReq.headers.get('x-agent-id')).toBe('agent-3')
    expect(passedReq.headers.get('x-agent-role')).toBe('service')
    expect(passedReq.headers.get('x-agent-zone')).toBe('starter')
  })

  it('calls handler with x-agent-id header set for valid API key', async () => {
    mockedCreateSupabaseServer.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as any)

    // First call: API key lookup; second call: agent profile fetch
    let callCount = 0
    mockedSupabaseAdmin.from = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // API key lookup
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'agent-4' },
                error: null,
              }),
            }),
          }),
        }
      }
      // Agent profile fetch
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'agent-4', role: 'client', zone: 'pro', suspension_status: null },
              error: null,
            }),
          }),
        }),
      }
    }) as any

    const handler = vi.fn(async (req: NextRequest) => NextResponse.json({ ok: true }))
    const wrapped = withAuth(handler)
    const res = await wrapped(makeRequest('http://localhost/api/test', { 'x-api-key': 'test-key-123' }))

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)

    const passedReq = handler.mock.calls[0][0] as NextRequest
    expect(passedReq.headers.get('x-agent-id')).toBe('agent-4')
    expect(passedReq.headers.get('x-agent-role')).toBe('client')
  })

  it('returns 401 when agent profile is not found', async () => {
    mockedCreateSupabaseServer.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'nonexistent' } },
          error: null,
        }),
      },
    } as any)

    mockedSupabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'not found' },
          }),
        }),
      }),
    }) as any

    const handler = stubHandler()
    const wrapped = withAuth(handler)
    const res = await wrapped(makeRequest())

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error.message).toContain('Agent not found')
    expect(handler).not.toHaveBeenCalled()
  })
})
