import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateClient = vi.fn().mockReturnValue({
  from: vi.fn(),
  auth: { getUser: vi.fn() },
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

describe('getSupabaseAdmin', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCreateClient.mockClear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-456'
  })

  it('creates a client with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', async () => {
    const { getSupabaseAdmin } = await import('../admin')
    getSupabaseAdmin()
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test-project.supabase.co',
      'test-service-role-key-456',
    )
  })

  it('returns the same instance on subsequent calls (singleton)', async () => {
    const fakeClient = { from: vi.fn(), auth: { getUser: vi.fn() } }
    mockCreateClient.mockReturnValue(fakeClient)
    const { getSupabaseAdmin } = await import('../admin')
    const first = getSupabaseAdmin()
    const second = getSupabaseAdmin()
    expect(first).toBe(second)
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
  })

  it('only calls createClient once even after multiple invocations', async () => {
    const { getSupabaseAdmin } = await import('../admin')
    getSupabaseAdmin()
    getSupabaseAdmin()
    getSupabaseAdmin()
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
  })
})

describe('supabaseAdmin proxy', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCreateClient.mockClear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-456'
  })

  it('delegates property access to the underlying admin client', async () => {
    const mockFrom = vi.fn().mockReturnValue({ select: vi.fn() })
    mockCreateClient.mockReturnValue({ from: mockFrom, auth: {} })
    const { supabaseAdmin } = await import('../admin')
    const fromResult = supabaseAdmin.from
    expect(fromResult).toBe(mockFrom)
  })

  it('lazily initializes the admin client on first property access', async () => {
    const { supabaseAdmin } = await import('../admin')
    expect(mockCreateClient).not.toHaveBeenCalled()
    // Access a property to trigger lazy init
    void supabaseAdmin.from
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
  })
})
