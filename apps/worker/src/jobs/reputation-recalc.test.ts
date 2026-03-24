import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use state object pattern so vi.mock hoisting works
vi.mock('@supabase/supabase-js', () => {
  const state = {
    rangeResults: [] as any[],
    rangeCallCount: 0,
    rpcResults: {} as Record<string, any[]>,
    rpcCallCounts: {} as Record<string, number>,
    rangeArgs: [] as any[],
  }

  const mockRpc = vi.fn().mockImplementation((fnName: string) => {
    if (!state.rpcResults[fnName]) state.rpcResults[fnName] = []
    if (!state.rpcCallCounts[fnName]) state.rpcCallCounts[fnName] = 0
    const result = state.rpcResults[fnName][state.rpcCallCounts[fnName]] ?? { data: null, error: null }
    state.rpcCallCounts[fnName]++
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
    __mockRpc: mockRpc,
  }
})

import { reputationBatchRecalc, calculateXp } from './reputation-recalc.js'

async function getState() {
  const mod = await import('@supabase/supabase-js') as any
  return mod.__state
}

async function getMockRpc() {
  const mod = await import('@supabase/supabase-js') as any
  return mod.__mockRpc
}

describe('calculateXp', () => {
  it('returns base XP (10) with no rating or solved', () => {
    expect(calculateXp()).toBe(10)
  })

  it('adds high rating bonus (+5) when rating >= 4', () => {
    expect(calculateXp(4)).toBe(15)
    expect(calculateXp(5)).toBe(15)
  })

  it('does not add rating bonus when rating < 4', () => {
    expect(calculateXp(3)).toBe(10)
    expect(calculateXp(1)).toBe(10)
  })

  it('adds solved bonus (+10) when solved is true', () => {
    expect(calculateXp(undefined, true)).toBe(20)
  })

  it('stacks both bonuses', () => {
    expect(calculateXp(5, true)).toBe(25)
  })

  it('does not add solved bonus when solved is false', () => {
    expect(calculateXp(5, false)).toBe(15)
  })
})

describe('reputationBatchRecalc', () => {
  beforeEach(async () => {
    process.env.SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
    const state = await getState()
    state.rangeResults = []
    state.rangeCallCount = 0
    state.rpcResults = {}
    state.rpcCallCounts = {}
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
    state.rpcResults['recalculate_reputation'] = [
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

  it('grants XP after recalc when agentId and rating are provided', async () => {
    const state = await getState()
    state.rangeResults = [
      { data: [{ id: 'agent-1' }], error: null },
    ]
    state.rpcResults['grant_xp_and_check_promotion'] = [
      { data: { promoted: true }, error: null },
    ]

    const result = await reputationBatchRecalc({
      batchSize: 10,
      agentId: 'agent-1',
      jobId: 'job-1',
      rating: 5,
      solved: true,
    })

    expect(result.xpGrant).toEqual({ xp: 25, promoted: true })
    const mockRpc = await getMockRpc()
    expect(mockRpc).toHaveBeenCalledWith('grant_xp_and_check_promotion', {
      p_agent_id: 'agent-1',
      p_base_xp: 25,
      p_rating: 5,
      p_solved: true,
    })
  })

  it('grants XP with lower bonus for rating < 4', async () => {
    const state = await getState()
    state.rangeResults = [{ data: [], error: null }]
    state.rpcResults['grant_xp_and_check_promotion'] = [
      { data: { promoted: false }, error: null },
    ]

    const result = await reputationBatchRecalc({
      agentId: 'agent-2',
      jobId: 'job-2',
      rating: 3,
      solved: false,
    })

    // base 10, no rating bonus, no solved bonus
    expect(result.xpGrant).toEqual({ xp: 10, promoted: false })
  })

  it('does not grant XP when agentId is missing', async () => {
    const state = await getState()
    state.rangeResults = [{ data: [], error: null }]

    const result = await reputationBatchRecalc({ batchSize: 10 })

    expect(result.xpGrant).toBeUndefined()
  })

  it('handles XP grant RPC error gracefully', async () => {
    const state = await getState()
    state.rangeResults = [{ data: [], error: null }]
    state.rpcResults['grant_xp_and_check_promotion'] = [
      { data: null, error: { message: 'XP RPC failed' } },
    ]

    const result = await reputationBatchRecalc({
      agentId: 'agent-1',
      jobId: 'job-1',
      rating: 5,
      solved: true,
    })

    // XP grant failed but overall recalc succeeded
    expect(result.success).toBe(true)
    expect(result.xpGrant).toBeUndefined()
  })

  it('defaults solved to false when not provided', async () => {
    const state = await getState()
    state.rangeResults = [{ data: [], error: null }]
    state.rpcResults['grant_xp_and_check_promotion'] = [
      { data: { promoted: false }, error: null },
    ]

    await reputationBatchRecalc({
      agentId: 'agent-1',
      rating: 4,
    })

    const mockRpc = await getMockRpc()
    expect(mockRpc).toHaveBeenCalledWith('grant_xp_and_check_promotion', {
      p_agent_id: 'agent-1',
      p_base_xp: 15,
      p_rating: 4,
      p_solved: false,
    })
  })
})
