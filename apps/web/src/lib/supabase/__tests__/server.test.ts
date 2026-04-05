import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateServerClient = vi.fn().mockReturnValue({ from: vi.fn() })
const mockCookieStore = {
  getAll: vi.fn().mockReturnValue([{ name: 'sb-token', value: 'abc123' }]),
  set: vi.fn(),
}
const mockCookies = vi.fn().mockResolvedValue(mockCookieStore)

vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
}))

vi.mock('next/headers', () => ({
  cookies: mockCookies,
}))

describe('createSupabaseServer', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCreateServerClient.mockClear()
    mockCookies.mockClear()
    mockCookieStore.getAll.mockClear()
    mockCookieStore.set.mockClear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-123'
  })

  it('awaits cookies() from next/headers', async () => {
    const { createSupabaseServer } = await import('../server')
    await createSupabaseServer()
    expect(mockCookies).toHaveBeenCalledTimes(1)
  })

  it('calls createServerClient with correct env vars', async () => {
    const { createSupabaseServer } = await import('../server')
    await createSupabaseServer()
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test-project.supabase.co',
      'test-anon-key-123',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    )
  })

  it('cookies.getAll delegates to cookieStore.getAll', async () => {
    const { createSupabaseServer } = await import('../server')
    await createSupabaseServer()
    const cookiesConfig = mockCreateServerClient.mock.calls[0]![2].cookies
    const result = cookiesConfig.getAll()
    expect(mockCookieStore.getAll).toHaveBeenCalled()
    expect(result).toEqual([{ name: 'sb-token', value: 'abc123' }])
  })

  it('cookies.setAll delegates to cookieStore.set for each cookie', async () => {
    const { createSupabaseServer } = await import('../server')
    await createSupabaseServer()
    const cookiesConfig = mockCreateServerClient.mock.calls[0]![2].cookies
    const cookiesToSet = [
      { name: 'token-a', value: 'val-a', options: { path: '/' } },
      { name: 'token-b', value: 'val-b', options: { path: '/', httpOnly: true } },
    ]
    cookiesConfig.setAll(cookiesToSet)
    expect(mockCookieStore.set).toHaveBeenCalledTimes(2)
    expect(mockCookieStore.set).toHaveBeenCalledWith('token-a', 'val-a', { path: '/' })
    expect(mockCookieStore.set).toHaveBeenCalledWith('token-b', 'val-b', { path: '/', httpOnly: true })
  })

  it('returns the client from createServerClient', async () => {
    const fakeClient = { from: vi.fn(), auth: {} }
    mockCreateServerClient.mockReturnValueOnce(fakeClient)
    const { createSupabaseServer } = await import('../server')
    const result = await createSupabaseServer()
    expect(result).toBe(fakeClient)
  })
})
