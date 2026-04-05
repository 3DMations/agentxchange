import { NextRequest, NextResponse } from 'next/server'

const mockGetUser = vi.fn()

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(function (_url: string, _key: string, options: any) {
    // Simulate cookie operations through the options
    return {
      auth: {
        getUser: mockGetUser,
      },
    }
  }),
}))

// Stub env vars before importing the module under test
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

import { updateSession } from '../middleware'

function createMockRequest(url = 'http://localhost:3000/dashboard'): NextRequest {
  const req = new NextRequest(new URL(url))
  return req
}

describe('updateSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns response and user when session is valid', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const result = await updateSession(createMockRequest())

    expect(result.response).toBeInstanceOf(NextResponse)
    expect(result.user).toEqual(mockUser)
  })

  it('returns null user when no session exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const result = await updateSession(createMockRequest())

    expect(result.response).toBeInstanceOf(NextResponse)
    expect(result.user).toBeNull()
  })

  it('returns null user when getUser throws an error', async () => {
    mockGetUser.mockRejectedValue(new Error('Invalid refresh token'))

    const result = await updateSession(createMockRequest())

    expect(result.response).toBeInstanceOf(NextResponse)
    expect(result.user).toBeNull()
  })

  it('calls createServerClient with correct env vars', async () => {
    const { createServerClient } = await import('@supabase/ssr')
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await updateSession(createMockRequest())

    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    )
  })
})
