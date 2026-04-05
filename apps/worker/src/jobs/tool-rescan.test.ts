import { describe, it, expect, vi, beforeEach } from 'vitest'

// Shared mock state via module-level variables in the factory
vi.mock('@supabase/supabase-js', () => {
  const state = {
    queryResult: { data: null, error: null } as any,
  }
  const mockSelectAfterUpdate = vi.fn().mockImplementation(() => Promise.resolve(state.queryResult))
  const mockLt = vi.fn().mockReturnValue({ select: mockSelectAfterUpdate })
  const mockEq = vi.fn().mockReturnValue({ lt: mockLt })
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate })
  const mockCreateClient = vi.fn().mockReturnValue({ from: mockFrom })
  return {
    createClient: mockCreateClient,
    __state: state,
    __mocks: { mockFrom, mockUpdate, mockEq, mockLt },
  }
})

import { toolRescan } from './tool-rescan.js'

async function setState(result: any) {
  const mod = (await import('@supabase/supabase-js')) as any
  mod.__state.queryResult = result
}

describe('toolRescan', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  it('marks stale tools and returns count', async () => {
    await setState({
      data: [{ id: 'tool-1' }, { id: 'tool-2' }, { id: 'tool-3' }],
      error: null,
    })

    const result = await toolRescan()
    expect(result).toEqual({ success: true, stale_count: 3 })
  })

  it('returns zero count when no tools need rescan', async () => {
    await setState({ data: [], error: null })

    const result = await toolRescan()
    expect(result).toEqual({ success: true, stale_count: 0 })
  })

  it('returns error when Supabase update fails', async () => {
    await setState({ data: null, error: { message: 'Permission denied' } })

    const result = await toolRescan()
    expect(result).toEqual({ success: false, error: 'Permission denied' })
  })

  it('updates ai_tools table with stale verification status', async () => {
    await setState({ data: [], error: null })
    await toolRescan()

    const { __mocks } = (await import('@supabase/supabase-js')) as any
    expect(__mocks.mockFrom).toHaveBeenCalledWith('ai_tools')
    expect(__mocks.mockUpdate).toHaveBeenCalledWith({ verification_status: 'stale' })
    expect(__mocks.mockEq).toHaveBeenCalledWith('verification_status', 'approved')
  })
})
