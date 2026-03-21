import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Shared mock state via module-level variables in the factory
vi.mock('@supabase/supabase-js', () => {
  const state = {
    singleResult: { data: null, error: null } as any,
  }
  const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })
  const mockSingle = vi.fn().mockImplementation(() => Promise.resolve(state.singleResult))
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockImplementation(() => ({ select: mockSelect, update: mockUpdate }))
  const mockCreateClient = vi.fn().mockReturnValue({ from: mockFrom })
  return {
    createClient: mockCreateClient,
    __state: state,
  }
})

import { webhookDispatch } from './webhook-dispatch.js'

async function setState(result: any) {
  const mod = await import('@supabase/supabase-js') as any
  mod.__state.singleResult = result
}

describe('webhookDispatch', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  it('throws when event not found', async () => {
    await setState({ data: null, error: { message: 'Not found' } })
    await expect(webhookDispatch({ eventId: 'missing-id' })).rejects.toThrow('Event not found')
  })

  it('sends webhook with HMAC signature and correct headers', async () => {
    await setState({
      data: {
        id: 'evt-1',
        event_type: 'job.completed',
        payload: { job_id: 'j1' },
        attempts: 0,
        subscription: {
          url: 'https://hook.example.com/callback',
          secret: 'webhook-secret-123',
        },
      },
      error: null,
    })
    mockFetch.mockResolvedValue({ ok: true, status: 200 })

    const result = await webhookDispatch({ eventId: 'evt-1' })

    expect(result).toEqual({ success: true, status: 200 })
    expect(mockFetch).toHaveBeenCalledOnce()

    const [url, opts] = mockFetch.mock.calls[0]!
    expect(url).toBe('https://hook.example.com/callback')
    expect(opts.method).toBe('POST')
    expect(opts.headers['Content-Type']).toBe('application/json')
    expect(opts.headers['X-AgentXchange-Event']).toBe('job.completed')
    expect(opts.headers['X-AgentXchange-Delivery']).toBe('evt-1')
    expect(opts.headers['X-AgentXchange-Signature']).toMatch(/^t=\d+,v1=[a-f0-9]+$/)
  })

  it('throws on non-OK response for BullMQ retry', async () => {
    await setState({
      data: {
        id: 'evt-2',
        event_type: 'job.created',
        payload: {},
        attempts: 1,
        subscription: { url: 'https://hook.example.com', secret: 'secret' },
      },
      error: null,
    })
    mockFetch.mockResolvedValue({ ok: false, status: 500 })

    await expect(webhookDispatch({ eventId: 'evt-2' })).rejects.toThrow('Webhook returned 500')
  })

  it('throws when subscription has no url', async () => {
    await setState({
      data: {
        id: 'evt-3',
        event_type: 'test',
        payload: {},
        attempts: 0,
        subscription: { url: null, secret: 'secret' },
      },
      error: null,
    })

    await expect(webhookDispatch({ eventId: 'evt-3' })).rejects.toThrow('Invalid subscription')
  })
})
