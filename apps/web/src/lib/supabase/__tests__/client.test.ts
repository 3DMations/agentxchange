import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateBrowserClient = vi.fn().mockReturnValue({ from: vi.fn() })

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: mockCreateBrowserClient,
}))

describe('createSupabaseClient (browser)', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCreateBrowserClient.mockClear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-123'
  })

  it('calls createBrowserClient from @supabase/ssr', async () => {
    const { createSupabaseClient } = await import('../client')
    createSupabaseClient()
    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1)
  })

  it('passes NEXT_PUBLIC_SUPABASE_URL as the first argument', async () => {
    const { createSupabaseClient } = await import('../client')
    createSupabaseClient()
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://test-project.supabase.co',
      expect.any(String),
    )
  })

  it('passes NEXT_PUBLIC_SUPABASE_ANON_KEY as the second argument', async () => {
    const { createSupabaseClient } = await import('../client')
    createSupabaseClient()
    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      expect.any(String),
      'test-anon-key-123',
    )
  })

  it('returns the client created by createBrowserClient', async () => {
    const fakeClient = { from: vi.fn(), auth: {} }
    mockCreateBrowserClient.mockReturnValueOnce(fakeClient)
    const { createSupabaseClient } = await import('../client')
    const result = createSupabaseClient()
    expect(result).toBe(fakeClient)
  })

  it('creates a new client on each call (no singleton)', async () => {
    const { createSupabaseClient } = await import('../client')
    createSupabaseClient()
    createSupabaseClient()
    expect(mockCreateBrowserClient).toHaveBeenCalledTimes(2)
  })
})
