import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient } from '../api-client.js'

describe('ApiClient', () => {
  let client: ApiClient
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    client = new ApiClient('test-api-key', { retryDelayMs: 0 })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  function mockFetch(response: unknown, status = 200) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      json: () => Promise.resolve(response),
    })
  }

  it('sends x-api-key header', async () => {
    mockFetch({ data: [], error: null, meta: {} })

    await client.searchAgents({ skill: 'typescript' })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/agents/search'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'test-api-key' }),
      }),
    )
  })

  it('adds Idempotency-Key header on POST requests', async () => {
    mockFetch({ data: { id: '1' }, error: null, meta: {} })

    await client.postRequest({
      description: 'test',
      acceptance_criteria: 'test',
      point_budget: 100,
    })

    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
    expect(callArgs[1].headers['Idempotency-Key']).toMatch(/^mcp-/)
  })

  it('retries on 500 errors', async () => {
    let callCount = 0
    globalThis.fetch = vi.fn().mockImplementation(() => {
      callCount++
      if (callCount < 3) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: () => Promise.resolve({ data: null, error: { code: 'SERVER_ERROR', message: 'fail' }, meta: {} }),
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { balance: 100 }, error: null, meta: {} }),
      })
    })

    const result = await client.checkWallet()

    expect(callCount).toBe(3)
    expect(result.data).toEqual({ balance: 100 })
  })

  it('does not retry on 400 errors', async () => {
    mockFetch({ data: null, error: { code: 'BAD_REQUEST', message: 'Invalid input' }, meta: {} }, 400)

    const result = await client.checkWallet()

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    expect(result.error?.message).toBe('Invalid input')
  })

  it('returns NETWORK_ERROR after all retries fail', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'))

    const result = await client.checkWallet()

    expect(result.error?.code).toBe('NETWORK_ERROR')
    expect(result.error?.message).toBe('Connection refused')
    // 1 initial + 3 retries = 4 calls
    expect(globalThis.fetch).toHaveBeenCalledTimes(4)
  })

  describe('endpoint methods', () => {
    beforeEach(() => {
      mockFetch({ data: {}, error: null, meta: {} })
    })

    it('searchAgents builds query string', async () => {
      await client.searchAgents({ skill: 'python', tier: 'gold' })
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/agents/search?skill=python&tier=gold'),
        expect.any(Object),
      )
    })

    it('getProfile returns error when no agent ID provided', async () => {
      const result = await client.getProfile()
      expect(result.error).toBeTruthy()
      expect(result.error!.code).toBe('VALIDATION_ERROR')
      expect(globalThis.fetch).not.toHaveBeenCalled()
    })

    it('getProfile uses agent ID when provided', async () => {
      await client.getProfile('agent-123')
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/agents/agent-123/profile'),
        expect.any(Object),
      )
    })

    it('submitDeliverable uses job ID in path', async () => {
      await client.submitDeliverable('job-1', { deliverable_id: 'del-1' })
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/requests/job-1/submit'),
        expect.any(Object),
      )
    })

    it('rateAgent uses job ID in path', async () => {
      await client.rateAgent('job-1', { helpfulness_score: 5, solved: true })
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/requests/job-1/rate'),
        expect.any(Object),
      )
    })

    it('listSkills works without params', async () => {
      await client.listSkills()
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/skills/catalog'),
        expect.any(Object),
      )
    })

    it('getZoneInfo works with zone name', async () => {
      await client.getZoneInfo('expert')
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/zones/expert'),
        expect.any(Object),
      )
    })

    it('getZoneInfo works without zone name', async () => {
      await client.getZoneInfo()
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/zones$/),
        expect.any(Object),
      )
    })

    it('registerTool sends POST', async () => {
      await client.registerTool({ name: 'test' })
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tools/register'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('getToolProfile uses tool ID', async () => {
      await client.getToolProfile('tool-1')
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tools/tool-1'),
        expect.any(Object),
      )
    })

    it('searchTools works with params', async () => {
      await client.searchTools({ query: 'llm' })
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tools/search?query=llm'),
        expect.any(Object),
      )
    })
  })
})
