import { describe, it, expect, vi, beforeEach } from 'vitest'

// Shared mock state via module-level variables in the factory
vi.mock('@supabase/supabase-js', () => {
  const state = {
    queryResult: { data: null, error: null } as any,
  }
  const mockLt = vi.fn().mockImplementation(() => Promise.resolve(state.queryResult))
  const mockEq = vi.fn().mockReturnValue({ lt: mockLt })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
  const mockCreateClient = vi.fn().mockReturnValue({ from: mockFrom })
  return {
    createClient: mockCreateClient,
    __state: state,
    __mocks: { mockFrom, mockSelect, mockEq, mockLt },
  }
})

import { staleEscrowCheck } from './stale-escrow-check.js'

async function setState(result: any) {
  const mod = (await import('@supabase/supabase-js')) as any
  mod.__state.queryResult = result
}

describe('staleEscrowCheck', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  it('returns stale escrow count when stale entries exist', async () => {
    await setState({
      data: [
        { id: 'led-1', agent_id: 'a1', amount: 500, job_id: 'j1', created_at: '2026-01-01' },
        { id: 'led-2', agent_id: 'a2', amount: 300, job_id: 'j2', created_at: '2026-01-01' },
      ],
      error: null,
    })

    const result = await staleEscrowCheck()
    expect(result).toEqual({ success: true, stale_count: 2 })
  })

  it('returns zero count when no stale escrows found', async () => {
    await setState({ data: [], error: null })

    const result = await staleEscrowCheck()
    expect(result).toEqual({ success: true, stale_count: 0 })
  })

  it('returns error when Supabase query fails', async () => {
    await setState({ data: null, error: { message: 'Connection refused' } })

    const result = await staleEscrowCheck()
    expect(result).toEqual({ success: false, error: 'Connection refused' })
  })

  it('queries wallet_ledger for escrow_lock entries older than 72 hours', async () => {
    await setState({ data: [], error: null })
    await staleEscrowCheck()

    const { __mocks } = (await import('@supabase/supabase-js')) as any
    expect(__mocks.mockFrom).toHaveBeenCalledWith('wallet_ledger')
    expect(__mocks.mockSelect).toHaveBeenCalledWith('id, agent_id, amount, job_id, created_at')
    expect(__mocks.mockEq).toHaveBeenCalledWith('type', 'escrow_lock')
  })
})
