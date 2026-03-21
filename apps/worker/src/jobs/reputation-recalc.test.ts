import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use state object pattern so vi.mock hoisting works
vi.mock('@supabase/supabase-js', () => {
  const state = {
    rangeResults: [] as any[],
    rangeCallCount: 0,
    rpcResults: [] as any[],
    rpcCallCount: 0,
    rangeArgs: [] as any[],
  }

  const mockRpc = vi.fn().mockImplementation(() => {
    const result = state.rpcResults[state.rpcCallCount] ?? { error: null }
    state.rpcCallCount++
    return Promise.resolve(result)
  })

  const mockRange = vi.fn().mockImplementation((...args: any[]) => {
    state.rangeArgs.push(args)
    const result = state.rangeResults[state.rangeCallCount] ?? { data: [], error: null }
    state.rangeCallCount++
    return Promise.resolve(result)
  })

  const mockGt = vi.fn().mockReturnValue({ range: mockRange })
  const mockSelect = vi.fn().mockReturnValue({ gt: mockGt })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })
  const mockCreateClient = vi.fn().mockReturnValue({ from: mockFrom, rpc: mockRpc })

  return {
    createClient: mockCreateClient,
    __state: state,
  }
})

import { reputationBatchRecalc } from './reputation-recalc.js'

async function getState() {
  const mod = await import('@supabase/supabase-js') as any
  return mod.__state
}

describe('reputationBatchRecalc', () => {
  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    const state = await getState()
    state.rangeResults = []
    state.rangeCallCount = 0
    state.rpcResults = []
    state.rpcCallCount = 0
    state.rangeArgs = []
  })

  it('processes agents in batches', async () => {
    const state = await getState()
    const batch1 = Array.from({ length: 3 }, (_, i) => ({ id: `agent-${i}` }))
    state.rangeResults = [
      { data: batch1, error: null },
      { data: [], error: null },
    ]

    const result = await reputationBatchRecalc({ batchSize: 3 })

    expect(result.success).toBe(true)
    expect(result.recalculated).toBe(3)
    expect(result.total).toBe(3)
  })

  it('continues processing when one agent fails', async () => {
    const state = await getState()
    state.rangeResults = [
      { data: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }], error: null },
      { data: [], error: null },
    ]
    state.rpcResults = [
      { error: null },
      { error: { message: 'RPC failed' } },
      { error: null },
    ]

    const result = await reputationBatchRecalc({ batchSize: 10 })

    expect(result.recalculated).toBe(2)
    expect(result.errors).toBe(1)
    expect(result.success).toBe(false)
  })

  it('handles fetch error gracefully', async () => {
    const state = await getState()
    state.rangeResults = [{ data: null, error: { message: 'DB error' } }]

    const result = await reputationBatchRecalc({ batchSize: 10 })

    expect(result.success).toBe(false)
    expect(result.error).toBe('DB error')
  })

  it('stops when fewer agents than batch size returned', async () => {
    const state = await getState()
    state.rangeResults = [
      { data: [{ id: 'a1' }, { id: 'a2' }], error: null },
    ]

    const result = await reputationBatchRecalc({ batchSize: 5 })

    // Should not fetch a second batch since 2 < 5
    expect(state.rangeCallCount).toBe(1)
    expect(result.recalculated).toBe(2)
  })

  it('uses default batch size of 50', async () => {
    const state = await getState()
    state.rangeResults = [{ data: [], error: null }]
    delete process.env.REPUTATION_BATCH_SIZE

    await reputationBatchRecalc()

    // range(0, 49) = batch size 50
    expect(state.rangeArgs[0]).toEqual([0, 49])
  })
})
