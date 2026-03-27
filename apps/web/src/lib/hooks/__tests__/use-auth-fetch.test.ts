// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuthFetch } from '../use-auth-fetch'

// Mock the Supabase client module
vi.mock('@/lib/supabase/client', () => ({
  createSupabaseClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token-123' } },
      }),
    },
  })),
}))

describe('useAuthFetch', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('attaches Authorization header with session token', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ data: { id: '1' }, error: null }),
    })

    const { result } = renderHook(() => useAuthFetch())

    let data: any
    await act(async () => {
      data = await result.current.authFetch('/api/v1/test')
    })

    expect(data).toEqual({ id: '1' })

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
    const headers = fetchCall[1]!.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer test-token-123')
  })

  it('unwraps ApiResponse envelope and returns data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [{ id: 'a' }, { id: 'b' }],
          error: null,
          meta: {},
        }),
    })

    const { result } = renderHook(() => useAuthFetch())

    let data: any
    await act(async () => {
      data = await result.current.authFetch('/api/v1/items')
    })

    expect(data).toEqual([{ id: 'a' }, { id: 'b' }])
  })

  it('throws on HTTP error with message from API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () =>
        Promise.resolve({
          data: null,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        }),
    })

    const { result } = renderHook(() => useAuthFetch())

    await act(async () => {
      await expect(
        result.current.authFetch('/api/v1/secret')
      ).rejects.toThrow('Access denied')
    })
  })

  it('throws on error when error is a string', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: null,
          error: 'Something went wrong',
        }),
    })

    const { result } = renderHook(() => useAuthFetch())

    await act(async () => {
      await expect(
        result.current.authFetch('/api/v1/test')
      ).rejects.toThrow('Something went wrong')
    })
  })

  it('throws generic message when error has no message field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          data: null,
          error: { code: 'INTERNAL' },
        }),
    })

    const { result } = renderHook(() => useAuthFetch())

    await act(async () => {
      await expect(
        result.current.authFetch('/api/v1/test')
      ).rejects.toThrow('Request failed (500)')
    })
  })

  it('merges custom headers with Authorization', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: null, error: null }),
    })

    const { result } = renderHook(() => useAuthFetch())

    await act(async () => {
      await result.current.authFetch('/api/v1/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'test-key',
        },
      })
    })

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
    const headers = fetchCall[1]!.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer test-token-123')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(headers.get('Idempotency-Key')).toBe('test-key')
    expect(fetchCall[1]!.method).toBe('POST')
  })

  it('sets isAuthenticated based on session presence', async () => {
    const { result } = renderHook(() => useAuthFetch())

    // After initial render + useEffect, isAuthenticated should resolve
    // The mock always returns a session, so it should be true
    // Give the effect time to run
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10))
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  it('handles no session gracefully (no Authorization header)', async () => {
    // Override mock for this test
    const { createSupabaseClient } = await import('@/lib/supabase/client')
    ;(createSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
        }),
      },
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'public', error: null }),
    })

    const { result } = renderHook(() => useAuthFetch())

    let data: any
    await act(async () => {
      data = await result.current.authFetch('/api/v1/public')
    })

    expect(data).toBe('public')

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
    const headers = fetchCall[1]!.headers as Headers
    expect(headers.has('Authorization')).toBe(false)
  })
})
