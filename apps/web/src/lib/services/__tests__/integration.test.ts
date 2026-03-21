import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Use service role client for integration tests (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Gracefully skip entire file if env var is not set
const describeIntegration = serviceRoleKey ? describe : describe.skip

const supabase = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : (null as unknown as ReturnType<typeof createClient>)

// Test data tracking for cleanup
const testAgentIds: string[] = []

describeIntegration('Integration: Database Schema', () => {
  it('should have all expected tables', async () => {
    const tables = [
      'agents', 'skills', 'jobs', 'wallet_ledger', 'ai_tools',
      'deliverables', 'deliverable_access_log', 'reputation_snapshots',
      'zone_config', 'disputes', 'sanctions', 'webhook_subscriptions', 'webhook_event_log',
    ]

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(0)
      expect(error, `Table '${table}' should exist`).toBeNull()
    }
  })

  it('should have zone_config seed data', async () => {
    const { data, error } = await supabase.from('zone_config').select('*').order('level_min')
    expect(error).toBeNull()
    expect(data).toHaveLength(5)
    expect(data![0].zone_name).toBe('starter')
    expect(data![4].zone_name).toBe('master')
  })

  it('zone_config should have correct point caps', async () => {
    const { data } = await supabase.from('zone_config').select('zone_name, job_point_cap').order('level_min')
    expect(data![0]).toMatchObject({ zone_name: 'starter', job_point_cap: 50 })
    expect(data![1]).toMatchObject({ zone_name: 'apprentice', job_point_cap: 200 })
    expect(data![2]).toMatchObject({ zone_name: 'journeyman', job_point_cap: 1000 })
    expect(data![3]).toMatchObject({ zone_name: 'expert', job_point_cap: 5000 })
    expect(data![4]).toMatchObject({ zone_name: 'master', job_point_cap: 999999 })
  })
})

describeIntegration('Integration: Agent CRUD', () => {
  const testEmail = `test-${Date.now()}@agentxchange.test`
  const testHandle = `test-agent-${Date.now()}`
  let testAgentId: string

  afterAll(async () => {
    // Cleanup: delete test agent
    if (testAgentId) {
      await supabase.from('agents').delete().eq('id', testAgentId)
      await supabase.auth.admin.deleteUser(testAgentId)
    }
  })

  it('should create an auth user and agent profile', async () => {
    // Create auth user via admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true,
    })
    expect(authError).toBeNull()
    expect(authData.user).toBeDefined()
    testAgentId = authData.user!.id
    testAgentIds.push(testAgentId)

    // Create agent profile
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        id: testAgentId,
        handle: testHandle,
        email: testEmail,
        role: 'service',
      })
      .select()
      .single()

    expect(agentError).toBeNull()
    expect(agent.handle).toBe(testHandle)
    expect(agent.zone).toBe('starter')
    expect(agent.level).toBe(1)
    expect(agent.total_xp).toBe(0)
    expect(agent.reputation_score).toBe(0)
  })

  it('should read agent profile', async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', testAgentId)
      .single()

    expect(error).toBeNull()
    expect(data.handle).toBe(testHandle)
  })

  it('should update agent profile', async () => {
    const { data, error } = await supabase
      .from('agents')
      .update({ trust_tier: 'bronze' })
      .eq('id', testAgentId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.trust_tier).toBe('bronze')
  })

  it('should auto-update updated_at on change', async () => {
    const { data: before } = await supabase
      .from('agents')
      .select('updated_at')
      .eq('id', testAgentId)
      .single()

    // Small delay to ensure timestamp differs
    await new Promise(r => setTimeout(r, 50))

    await supabase
      .from('agents')
      .update({ trust_tier: 'silver' })
      .eq('id', testAgentId)

    const { data: after } = await supabase
      .from('agents')
      .select('updated_at')
      .eq('id', testAgentId)
      .single()

    expect(new Date(after!.updated_at).getTime()).toBeGreaterThan(new Date(before!.updated_at).getTime())
  })
})

describeIntegration('Integration: Wallet RPC Functions', () => {
  let clientAgentId: string
  let serviceAgentId: string

  beforeAll(async () => {
    // Create two test agents
    const { data: client } = await supabase.auth.admin.createUser({
      email: `wallet-client-${Date.now()}@test.com`,
      password: 'test12345678',
      email_confirm: true,
    })
    clientAgentId = client.user!.id
    testAgentIds.push(clientAgentId)

    await supabase.from('agents').insert({
      id: clientAgentId,
      handle: `wallet-client-${Date.now()}`,
      email: `wallet-client-${Date.now()}@test.com`,
      role: 'client',
    })

    const { data: service } = await supabase.auth.admin.createUser({
      email: `wallet-service-${Date.now()}@test.com`,
      password: 'test12345678',
      email_confirm: true,
    })
    serviceAgentId = service.user!.id
    testAgentIds.push(serviceAgentId)

    await supabase.from('agents').insert({
      id: serviceAgentId,
      handle: `wallet-service-${Date.now()}`,
      email: `wallet-service-${Date.now()}@test.com`,
      role: 'service',
    })
  })

  afterAll(async () => {
    // Cleanup
    for (const id of [clientAgentId, serviceAgentId]) {
      if (id) {
        await supabase.from('wallet_ledger').delete().eq('agent_id', id)
        await supabase.from('agents').delete().eq('id', id)
        await supabase.auth.admin.deleteUser(id)
      }
    }
  })

  it('wallet_get_balance should return zeros for new agent', async () => {
    const { data, error } = await supabase.rpc('wallet_get_balance', {
      p_agent_id: clientAgentId,
    })
    expect(error).toBeNull()
    expect(data).toMatchObject({ available: 0, escrowed: 0, total: 0 })
  })

  it('wallet_grant_starter_bonus should credit agent', async () => {
    const { data, error } = await supabase.rpc('wallet_grant_starter_bonus', {
      p_agent_id: clientAgentId,
      p_amount: 100,
      p_idempotency_key: `starter-${clientAgentId}-${Date.now()}`,
    })
    expect(error).toBeNull()
    expect(data).toMatchObject({ status: 'granted', new_balance: 100 })

    // Verify balance
    const { data: balance } = await supabase.rpc('wallet_get_balance', {
      p_agent_id: clientAgentId,
    })
    expect(balance).toMatchObject({ available: 100, escrowed: 0, total: 100 })
  })

  it('wallet_grant_starter_bonus should be idempotent', async () => {
    const idempotencyKey = `idem-test-${Date.now()}`

    const { data: first } = await supabase.rpc('wallet_grant_starter_bonus', {
      p_agent_id: serviceAgentId,
      p_amount: 50,
      p_idempotency_key: idempotencyKey,
    })
    expect(first.status).toBe('granted')

    // Same key again
    const { data: second } = await supabase.rpc('wallet_grant_starter_bonus', {
      p_agent_id: serviceAgentId,
      p_amount: 50,
      p_idempotency_key: idempotencyKey,
    })
    expect(second.status).toBe('already_processed')

    // Balance should only reflect one grant
    const { data: balance } = await supabase.rpc('wallet_get_balance', {
      p_agent_id: serviceAgentId,
    })
    expect(balance.available).toBe(50)
  })

  it('wallet_escrow_lock should lock funds', async () => {
    // Client already has 100 from starter bonus
    const jobId = crypto.randomUUID()
    const { data, error } = await supabase.rpc('wallet_escrow_lock', {
      p_client_agent_id: clientAgentId,
      p_job_id: jobId,
      p_amount: 30,
      p_idempotency_key: `escrow-lock-${Date.now()}`,
    })
    expect(error).toBeNull()
    expect(data).toMatchObject({ status: 'locked', new_balance: 70 })

    const { data: balance } = await supabase.rpc('wallet_get_balance', {
      p_agent_id: clientAgentId,
    })
    expect(balance.available).toBe(70)
    expect(balance.escrowed).toBe(30)
    expect(balance.total).toBe(100)
  })

  it('wallet_escrow_lock should reject insufficient funds', async () => {
    const { error } = await supabase.rpc('wallet_escrow_lock', {
      p_client_agent_id: clientAgentId,
      p_job_id: crypto.randomUUID(),
      p_amount: 999,
      p_idempotency_key: `escrow-fail-${Date.now()}`,
    })
    expect(error).not.toBeNull()
    expect(error!.message).toContain('INSUFFICIENT_FUNDS')
  })

  it('wallet_reconciliation_check should return clean results', async () => {
    const { data, error } = await supabase.rpc('wallet_reconciliation_check')
    expect(error).toBeNull()
    expect(data).toHaveProperty('total_credits')
    expect(data).toHaveProperty('negative_balance_agents')
    expect(data.negative_balance_agents).toEqual([])
  })
})

describeIntegration('Integration: Reputation RPC', () => {
  let agentId: string

  beforeAll(async () => {
    const { data } = await supabase.auth.admin.createUser({
      email: `rep-test-${Date.now()}@test.com`,
      password: 'test12345678',
      email_confirm: true,
    })
    agentId = data.user!.id
    testAgentIds.push(agentId)

    await supabase.from('agents').insert({
      id: agentId,
      handle: `rep-test-${Date.now()}`,
      email: `rep-test-${Date.now()}@test.com`,
      role: 'service',
    })
  })

  afterAll(async () => {
    if (agentId) {
      await supabase.from('reputation_snapshots').delete().eq('agent_id', agentId)
      await supabase.from('agents').delete().eq('id', agentId)
      await supabase.auth.admin.deleteUser(agentId)
    }
  })

  it('recalculate_reputation should work for agent with no jobs', async () => {
    const { data, error } = await supabase.rpc('recalculate_reputation', {
      p_agent_id: agentId,
    })
    expect(error).toBeNull()
    expect(data).toMatchObject({ score: expect.any(Number), confidence: 'unrated', job_count: 0 })
  })

  it('should create a reputation snapshot', async () => {
    const { data, error } = await supabase
      .from('reputation_snapshots')
      .select('*')
      .eq('agent_id', agentId)
      .single()

    expect(error).toBeNull()
    expect(data.confidence_tier).toBe('unrated')
    // Score is 0.1 for new agents: (0*0.4 + 0*0.3 + 0*0.2 + (1-0)*0.1) = 0.1
    expect(data.score).toBeCloseTo(0.1, 1)
  })
})

// Global cleanup
afterAll(async () => {
  if (!serviceRoleKey) return
  for (const id of testAgentIds) {
    try {
      await supabase.from('wallet_ledger').delete().eq('agent_id', id)
      await supabase.from('reputation_snapshots').delete().eq('agent_id', id)
      await supabase.from('skills').delete().eq('agent_id', id)
      await supabase.from('agents').delete().eq('id', id)
      await supabase.auth.admin.deleteUser(id)
    } catch { /* best effort cleanup */ }
  }
})
