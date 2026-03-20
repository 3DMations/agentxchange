import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AgentXchangeClient } from '../index.js'

describe('AgentXchangeClient', () => {
  const mockFetch = vi.fn()
  let client: AgentXchangeClient

  function ok<T>(data: T) {
    return { json: () => Promise.resolve({ data, error: null, meta: {} }), status: 200 }
  }
  function okPaged<T>(data: T, cursor_next?: string) {
    return { json: () => Promise.resolve({ data, error: null, meta: { cursor_next } }), status: 200 }
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    client = new AgentXchangeClient({ baseUrl: 'https://api.test.com', apiKey: 'test-key' })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function lastUrl(): string {
    return mockFetch.mock.calls[mockFetch.mock.calls.length - 1]![0] as string
  }
  function lastMethod(): string {
    return (mockFetch.mock.calls[mockFetch.mock.calls.length - 1]![1] as RequestInit).method!
  }
  function lastBody(): unknown {
    const raw = (mockFetch.mock.calls[mockFetch.mock.calls.length - 1]![1] as RequestInit).body as string
    return JSON.parse(raw)
  }

  // ── Agents ──
  describe('Agents', () => {
    it('register', async () => {
      mockFetch.mockResolvedValue(ok({ agent: { id: '1' }, session: {} }))
      const res = await client.register({ email: 'a@b.com', password: 'pass', handle: 'bot1' })
      expect(res.data?.agent.id).toBe('1')
      expect(lastUrl()).toBe('https://api.test.com/agents/register')
      expect(lastMethod()).toBe('POST')
    })

    it('login', async () => {
      mockFetch.mockResolvedValue(ok({ agent: { id: '1' }, session: {} }))
      await client.login({ email: 'a@b.com', password: 'pass' })
      expect(lastUrl()).toBe('https://api.test.com/agents/login')
    })

    it('getProfile', async () => {
      mockFetch.mockResolvedValue(ok({ id: 'a1', handle: 'bot1' }))
      await client.getProfile('a1')
      expect(lastUrl()).toBe('https://api.test.com/agents/a1/profile')
      expect(lastMethod()).toBe('GET')
    })

    it('updateProfile', async () => {
      mockFetch.mockResolvedValue(ok({ id: 'a1', handle: 'new-handle' }))
      await client.updateProfile('a1', { handle: 'new-handle' })
      expect(lastMethod()).toBe('PUT')
      expect(lastBody()).toEqual({ handle: 'new-handle' })
    })

    it('searchAgents with params', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.searchAgents({ zone: 'starter', limit: 10 })
      expect(lastUrl()).toContain('zone=starter')
      expect(lastUrl()).toContain('limit=10')
    })

    it('acknowledgeOnboarding', async () => {
      mockFetch.mockResolvedValue(ok({ acknowledged_at: '2026-01-01' }))
      await client.acknowledgeOnboarding('a1', 1)
      expect(lastBody()).toEqual({ prompt_version: 1 })
    })

    it('getAgentZone', async () => {
      mockFetch.mockResolvedValue(ok({ zone: 'starter', level: 1, xp: 0 }))
      await client.getAgentZone('a1')
      expect(lastUrl()).toBe('https://api.test.com/agents/a1/zone')
    })
  })

  // ── Skills ──
  describe('Skills', () => {
    it('getAgentSkills', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.getAgentSkills('a1')
      expect(lastUrl()).toBe('https://api.test.com/agents/a1/skills')
    })

    it('createSkill', async () => {
      mockFetch.mockResolvedValue(ok({ id: 's1' }))
      await client.createSkill('a1', {
        category: 'code_generation', domain: 'typescript', name: 'TS Expert',
        description: 'TypeScript', point_range_min: 10, point_range_max: 100,
      })
      expect(lastUrl()).toBe('https://api.test.com/agents/a1/skills')
      expect(lastMethod()).toBe('POST')
    })

    it('updateSkill', async () => {
      mockFetch.mockResolvedValue(ok({ id: 's1' }))
      await client.updateSkill('a1', 's1', { name: 'Updated' })
      expect(lastUrl()).toBe('https://api.test.com/agents/a1/skills/s1')
      expect(lastMethod()).toBe('PUT')
    })

    it('deleteSkill', async () => {
      mockFetch.mockResolvedValue(ok({ deleted: true }))
      await client.deleteSkill('a1', 's1')
      expect(lastMethod()).toBe('DELETE')
    })

    it('searchSkills', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.searchSkills({ q: 'typescript', category: 'code_generation' })
      expect(lastUrl()).toContain('skills/catalog')
      expect(lastUrl()).toContain('q=typescript')
    })

    it('verifySkill', async () => {
      mockFetch.mockResolvedValue(ok({ verification_status: 'pending' }))
      await client.verifySkill('s1', 'platform_test_job')
      expect(lastUrl()).toBe('https://api.test.com/skills/s1/verify')
    })
  })

  // ── Jobs ──
  describe('Jobs', () => {
    it('createJob', async () => {
      mockFetch.mockResolvedValue(ok({ id: 'j1', status: 'open' }))
      const res = await client.createJob({ description: 'Build API', acceptance_criteria: 'Tests pass', point_budget: 100 })
      expect(res.data?.status).toBe('open')
      expect(lastMethod()).toBe('POST')
    })

    it('listJobs with filters', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.listJobs({ status: 'open', zone: 'starter', limit: 5 })
      expect(lastUrl()).toContain('status=open')
      expect(lastUrl()).toContain('zone=starter')
    })

    it('getJob', async () => {
      mockFetch.mockResolvedValue(ok({ id: 'j1' }))
      await client.getJob('j1')
      expect(lastUrl()).toBe('https://api.test.com/requests/j1')
    })

    it('acceptJob', async () => {
      mockFetch.mockResolvedValue(ok({ id: 'j1', status: 'accepted' }))
      await client.acceptJob('j1', 80)
      expect(lastBody()).toEqual({ point_quote: 80 })
    })

    it('submitJob', async () => {
      mockFetch.mockResolvedValue(ok({ id: 'j1', status: 'submitted' }))
      await client.submitJob('j1', 'del-1', 'Done')
      expect(lastBody()).toEqual({ deliverable_id: 'del-1', notes: 'Done' })
    })

    it('rateJob', async () => {
      mockFetch.mockResolvedValue(ok({ reputation_update: {}, xp_update: {} }))
      await client.rateJob('j1', { helpfulness_score: 5, solved: true, feedback: 'Great' })
      expect(lastBody()).toEqual({ helpfulness_score: 5, solved: true, feedback: 'Great' })
    })
  })

  // ── Wallet ──
  describe('Wallet', () => {
    it('getBalance', async () => {
      mockFetch.mockResolvedValue(ok({ available: 100, escrowed: 20, total: 120 }))
      const res = await client.getBalance()
      expect(res.data?.total).toBe(120)
    })

    it('escrowLock', async () => {
      mockFetch.mockResolvedValue(ok({ status: 'locked', new_balance: 80 }))
      await client.escrowLock('j1', 20)
      expect(lastBody()).toEqual({ job_id: 'j1', amount: 20 })
    })

    it('escrowRelease', async () => {
      mockFetch.mockResolvedValue(ok({ status: 'released', released_amount: 20, platform_fee: 2 }))
      await client.escrowRelease('j1')
      expect(lastBody()).toEqual({ job_id: 'j1' })
    })

    it('refund', async () => {
      mockFetch.mockResolvedValue(ok({ status: 'refunded', refunded_amount: 20 }))
      await client.refund('j1')
      expect(lastBody()).toEqual({ job_id: 'j1' })
    })

    it('getLedger', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.getLedger({ type: 'credit', limit: 10 })
      expect(lastUrl()).toContain('type=credit')
    })
  })

  // ── Reputation ──
  describe('Reputation', () => {
    it('getReputation', async () => {
      mockFetch.mockResolvedValue(ok({ score: 85, confidence_tier: 'high' }))
      const res = await client.getReputation('a1')
      expect(res.data?.score).toBe(85)
      expect(lastUrl()).toBe('https://api.test.com/reputation/a1')
    })
  })

  // ── Disputes ──
  describe('Disputes', () => {
    it('createDispute', async () => {
      mockFetch.mockResolvedValue(ok({ id: 'd1', status: 'open' }))
      await client.createDispute({ job_id: 'j1', reason: 'Incomplete work' })
      expect(lastMethod()).toBe('POST')
    })

    it('listDisputes', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.listDisputes({ status: 'open' })
      expect(lastUrl()).toContain('status=open')
    })
  })

  // ── Tools ──
  describe('Tools', () => {
    it('registerTool', async () => {
      mockFetch.mockResolvedValue(ok({ id: 't1' }))
      await client.registerTool({
        name: 'GPT-4', provider: 'OpenAI', version: '4.0', url: 'https://openai.com',
        category: 'llm', capabilities: ['text-generation'],
      })
      expect(lastMethod()).toBe('POST')
    })

    it('searchTools', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.searchTools({ category: 'llm' })
      expect(lastUrl()).toContain('category=llm')
    })

    it('getTool', async () => {
      mockFetch.mockResolvedValue(ok({ id: 't1' }))
      await client.getTool('t1')
      expect(lastUrl()).toBe('https://api.test.com/tools/t1')
    })

    it('updateTool', async () => {
      mockFetch.mockResolvedValue(ok({ id: 't1' }))
      await client.updateTool('t1', { name: 'GPT-4o' })
      expect(lastMethod()).toBe('PUT')
    })

    it('approveTool', async () => {
      mockFetch.mockResolvedValue(ok({ id: 't1', verification_status: 'approved' }))
      await client.approveTool('t1', true)
      expect(lastBody()).toEqual({ approved: true })
    })

    it('rescanTool', async () => {
      mockFetch.mockResolvedValue(ok({ scan_status: 'pending' }))
      await client.rescanTool('t1')
      expect(lastUrl()).toBe('https://api.test.com/tools/t1/rescan')
    })

    it('getToolStats', async () => {
      mockFetch.mockResolvedValue(ok({ usage_count: 50, avg_rating: 4.5, agents_using: 10 }))
      const res = await client.getToolStats('t1')
      expect(res.data?.usage_count).toBe(50)
    })
  })

  // ── Zones ──
  describe('Zones', () => {
    it('listZones', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.listZones()
      expect(lastUrl()).toBe('https://api.test.com/zones')
    })

    it('getLeaderboard', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.getLeaderboard('starter', { limit: 5 })
      expect(lastUrl()).toContain('zones/starter/leaderboard')
      expect(lastUrl()).toContain('limit=5')
    })

    it('getNewArrivals', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.getNewArrivals('starter')
      expect(lastUrl()).toContain('zones/starter/new-arrivals')
    })
  })

  // ── Webhooks ──
  describe('Webhooks', () => {
    it('createWebhookSubscription', async () => {
      mockFetch.mockResolvedValue(ok({ id: 'w1', active: true }))
      await client.createWebhookSubscription({ url: 'https://hook.test.com', event_types: ['job_accepted'] })
      expect(lastMethod()).toBe('POST')
      expect(lastBody()).toEqual({ url: 'https://hook.test.com', event_types: ['job_accepted'] })
    })

    it('listWebhookSubscriptions', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.listWebhookSubscriptions()
      expect(lastUrl()).toBe('https://api.test.com/webhooks/subscriptions')
    })
  })

  // ── Admin ──
  describe('Admin', () => {
    it('adminListDisputes', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.adminListDisputes({ status: 'open' })
      expect(lastUrl()).toContain('admin/disputes')
      expect(lastUrl()).toContain('status=open')
    })

    it('adminListAgents', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.adminListAgents({ role: 'service', zone: 'expert' })
      expect(lastUrl()).toContain('admin/agents')
      expect(lastUrl()).toContain('role=service')
    })

    it('adminGetKpis', async () => {
      mockFetch.mockResolvedValue(ok({ total_agents: 100, active_jobs: 50 }))
      const res = await client.adminGetKpis()
      expect(res.data?.total_agents).toBe(100)
      expect(lastUrl()).toBe('https://api.test.com/admin/dashboard/kpis')
    })

    it('adminUpdateZoneConfig', async () => {
      mockFetch.mockResolvedValue(ok({ id: 'z1' }))
      await client.adminUpdateZoneConfig('starter', { job_point_cap: 500 })
      expect(lastUrl()).toBe('https://api.test.com/admin/zones/starter/config')
      expect(lastMethod()).toBe('PUT')
      expect(lastBody()).toEqual({ job_point_cap: 500 })
    })

    it('adminGetWalletAnomalies', async () => {
      mockFetch.mockResolvedValue(ok({ anomalies: [] }))
      await client.adminGetWalletAnomalies()
      expect(lastUrl()).toBe('https://api.test.com/admin/wallet/anomalies')
    })

    it('adminGetFlaggedTools', async () => {
      mockFetch.mockResolvedValue(ok([]))
      await client.adminGetFlaggedTools({ limit: 20 })
      expect(lastUrl()).toContain('admin/tools/flagged')
    })
  })

  // ── Pagination Helper ──
  describe('paginate', () => {
    it('iterates through all pages', async () => {
      mockFetch
        .mockResolvedValueOnce(okPaged([1, 2], 'cursor-2'))
        .mockResolvedValueOnce(okPaged([3, 4], 'cursor-3'))
        .mockResolvedValueOnce(okPaged([5], undefined))

      const allItems: number[] = []
      for await (const page of client.paginate<number>(
        (params) => client.listJobs(params) as Promise<any>,
      )) {
        allItems.push(...page)
      }
      expect(allItems).toEqual([1, 2, 3, 4, 5])
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('stops on error', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: null, error: { code: 'FORBIDDEN', message: 'no' }, meta: {} }),
        status: 403,
      })

      const pages: unknown[][] = []
      for await (const page of client.paginate<unknown>(
        (params) => client.listJobs(params) as Promise<any>,
      )) {
        pages.push(page)
      }
      expect(pages).toEqual([])
    })
  })
})
