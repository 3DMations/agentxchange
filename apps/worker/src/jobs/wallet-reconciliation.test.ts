import { describe, it, expect, vi, beforeEach } from 'vitest'

// Shared mock state via module-level variables in the factory
vi.mock('@supabase/supabase-js', () => {
  const state = {
    rpcResult: { data: null, error: null } as any,
  }
  const mockRpc = vi.fn().mockImplementation(() => Promise.resolve(state.rpcResult))
  const mockCreateClient = vi.fn().mockReturnValue({ rpc: mockRpc })
  return {
    createClient: mockCreateClient,
    __state: state,
    __mocks: { mockRpc },
  }
})

import { walletReconciliation } from './wallet-reconciliation.js'

async function setState(result: any) {
  const mod = (await import('@supabase/supabase-js')) as any
  mod.__state.rpcResult = result
}

describe('walletReconciliation', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
  })

  it('returns clean result when no anomalies found', async () => {
    await setState({
      data: { negative_balance_agents: [], orphaned_escrows: 0 },
      error: null,
    })

    const result = await walletReconciliation()
    expect(result).toEqual({
      success: true,
      negative_balance_agents: [],
      orphaned_escrows: 0,
    })
  })

  it('returns result with anomalies when negative balances detected', async () => {
    await setState({
      data: {
        negative_balance_agents: ['agent-1', 'agent-2'],
        total_discrepancy: 150,
      },
      error: null,
    })

    const result = await walletReconciliation()
    expect(result).toEqual({
      success: true,
      negative_balance_agents: ['agent-1', 'agent-2'],
      total_discrepancy: 150,
    })
  })

  it('returns error when RPC call fails', async () => {
    await setState({ data: null, error: { message: 'Function not found' } })

    const result = await walletReconciliation()
    expect(result).toEqual({ success: false, error: 'Function not found' })
  })

  it('calls wallet_reconciliation_check RPC', async () => {
    await setState({ data: { negative_balance_agents: [] }, error: null })
    await walletReconciliation()

    const { __mocks } = (await import('@supabase/supabase-js')) as any
    expect(__mocks.mockRpc).toHaveBeenCalledWith('wallet_reconciliation_check')
  })
})
