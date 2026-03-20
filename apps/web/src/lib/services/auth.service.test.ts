import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the admin client before importing AuthService
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    auth: { admin: { deleteUser: vi.fn() } },
  },
}))

vi.mock('@/lib/utils/logger', () => ({
  createServiceLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import { AuthService } from './auth.service'
import { supabaseAdmin } from '@/lib/supabase/admin'

const mockedAdmin = vi.mocked(supabaseAdmin)

function createMockSupabase() {
  return {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(),
  } as any
}

describe('AuthService', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>
  let service: AuthService

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabase()
    service = new AuthService(mockSupabase)
  })

  it('should instantiate with a supabase client', () => {
    expect(service).toBeDefined()
  })

  it('should have all required methods', () => {
    const methods = ['register', 'login', 'acknowledgeOnboarding', 'validateApiKey', 'generateApiKey']
    methods.forEach(method => {
      expect(typeof (service as any)[method]).toBe('function')
    })
  })

  describe('register', () => {
    it('calls supabase.auth.signUp with correct email and password', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' }
      const mockSession = { access_token: 'tok' }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockedAdmin.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-1', handle: 'testagent', email: 'test@example.com', role: 'service' },
              error: null,
            }),
          }),
        }),
      }) as any

      await service.register('test@example.com', 'password123', 'testagent', 'service')

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('returns agent and session on successful registration', async () => {
      const mockUser = { id: 'user-2', email: 'a@b.com' }
      const mockSession = { access_token: 'tok2' }
      const mockAgent = { id: 'user-2', handle: 'agent2', email: 'a@b.com', role: 'client' }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockedAdmin.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgent,
              error: null,
            }),
          }),
        }),
      }) as any

      const result = await service.register('a@b.com', 'pass', 'agent2', 'client')

      expect(result.agent).toEqual(mockAgent)
      expect(result.session).toEqual(mockSession)
    })

    it('throws when signUp returns an error', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' },
      })

      await expect(service.register('dup@example.com', 'pass', 'dupagent'))
        .rejects.toThrow('Email already registered')
    })

    it('throws when signUp returns no user', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      await expect(service.register('nouser@example.com', 'pass', 'noagent'))
        .rejects.toThrow('Registration failed: no user returned')
    })

    it('cleans up auth user if agent profile creation fails', async () => {
      const mockUser = { id: 'user-cleanup' }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: {} },
        error: null,
      })

      mockedAdmin.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Duplicate handle' },
            }),
          }),
        }),
      }) as any

      await expect(service.register('x@y.com', 'pass', 'duphandle'))
        .rejects.toThrow('Duplicate handle')

      expect(mockedAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('user-cleanup')
    })
  })

  describe('login', () => {
    it('calls supabase.auth.signInWithPassword with correct credentials', async () => {
      const mockUser = { id: 'user-login' }
      const mockSession = { access_token: 'login-tok' }
      const mockAgent = { id: 'user-login', handle: 'loginagent' }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockAgent,
              error: null,
            }),
          }),
        }),
      })

      const result = await service.login('test@example.com', 'mypass')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'mypass',
      })
      expect(result.agent).toEqual(mockAgent)
      expect(result.session).toEqual(mockSession)
    })

    it('throws when signInWithPassword returns an error', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      })

      await expect(service.login('bad@example.com', 'wrong'))
        .rejects.toThrow('Invalid login credentials')
    })

    it('throws when agent profile is not found after login', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'orphan' }, session: {} },
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'not found' },
            }),
          }),
        }),
      })

      await expect(service.login('orphan@example.com', 'pass'))
        .rejects.toThrow('Agent profile not found')
    })
  })
})
