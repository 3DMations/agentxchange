import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPostRequestHandler } from '../tools/post-request.js'
import { createSearchAgentsHandler } from '../tools/search-agents.js'
import { createSubmitDeliverableHandler } from '../tools/submit-deliverable.js'
import { createRateAgentHandler } from '../tools/rate-agent.js'
import { createCheckWalletHandler } from '../tools/check-wallet.js'
import { createGetProfileHandler } from '../tools/get-profile.js'
import { createListSkillsHandler } from '../tools/list-skills.js'
import { createGetZoneInfoHandler } from '../tools/get-zone-info.js'
import { createRegisterToolHandler } from '../tools/register-tool.js'
import { createGetToolProfileHandler } from '../tools/get-tool-profile.js'
import { createSearchToolsHandler } from '../tools/search-tools.js'
import { postRequestTool } from '../tools/post-request.js'
import { checkWalletTool } from '../tools/check-wallet.js'
import { getToolProfileTool } from '../tools/get-tool-profile.js'
import type { ApiClient } from '../api-client.js'

function createMockClient(): ApiClient {
  return {
    postRequest: vi.fn(),
    searchAgents: vi.fn(),
    submitDeliverable: vi.fn(),
    rateAgent: vi.fn(),
    checkWallet: vi.fn(),
    getProfile: vi.fn(),
    listSkills: vi.fn(),
    getZoneInfo: vi.fn(),
    registerTool: vi.fn(),
    getToolProfile: vi.fn(),
    searchTools: vi.fn(),
  } as unknown as ApiClient
}

function successResponse(data: unknown) {
  return { data, error: null, meta: {} }
}

function errorResponse(message: string, code = 'BAD_REQUEST') {
  return { data: null, error: { code, message }, meta: {} }
}

type MockFn = ReturnType<typeof vi.fn>

describe('MCP Tool Handlers — Comprehensive', () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    vi.clearAllMocks()
    client = createMockClient()
  })

  // ─── post_request ──────────────────────────────────────────────────

  describe('post_request', () => {
    it('returns formatted JSON data on success', async () => {
      const jobData = { id: 'job-abc', status: 'open', description: 'Build widget' }
      ;(client.postRequest as MockFn).mockResolvedValue(successResponse(jobData))

      const handler = createPostRequestHandler(client)
      const result = await handler({
        description: 'Build widget',
        acceptance_criteria: 'Must compile',
        point_budget: 200,
      })

      expect(result.isError).toBeUndefined()
      const parsed = JSON.parse(result.content[0]!.text)
      expect(parsed).toEqual(jobData)
    })

    it('returns isError true with message on API error', async () => {
      ;(client.postRequest as MockFn).mockResolvedValue(errorResponse('Validation failed'))

      const handler = createPostRequestHandler(client)
      const result = await handler({
        description: 'x',
        acceptance_criteria: 'y',
        point_budget: 0,
      })

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe('Error: Validation failed')
    })

    it('passes optional required_skills and tools_required', async () => {
      ;(client.postRequest as MockFn).mockResolvedValue(successResponse({ id: 'j1' }))

      const handler = createPostRequestHandler(client)
      await handler({
        description: 'Task',
        acceptance_criteria: 'Done',
        point_budget: 50,
        required_skills: ['rust', 'wasm'],
        tools_required: ['tool-1'],
      })

      expect(client.postRequest).toHaveBeenCalledWith({
        description: 'Task',
        acceptance_criteria: 'Done',
        point_budget: 50,
        required_skills: ['rust', 'wasm'],
        tools_required: ['tool-1'],
      })
    })

    it('tool definition has correct required fields', () => {
      expect(postRequestTool.name).toBe('post_request')
      expect(postRequestTool.inputSchema.required).toEqual([
        'description',
        'acceptance_criteria',
        'point_budget',
      ])
    })
  })

  // ─── search_agents ─────────────────────────────────────────────────

  describe('search_agents', () => {
    it('returns agent list on success', async () => {
      const agents = [{ id: 'a1', alias: 'Alpha' }, { id: 'a2', alias: 'Beta' }]
      ;(client.searchAgents as MockFn).mockResolvedValue(successResponse(agents))

      const handler = createSearchAgentsHandler(client)
      const result = await handler({ skill: 'python' })

      expect(result.isError).toBeUndefined()
      const parsed = JSON.parse(result.content[0]!.text)
      expect(parsed).toHaveLength(2)
    })

    it('returns error on API failure', async () => {
      ;(client.searchAgents as MockFn).mockResolvedValue(errorResponse('Service unavailable', 'SERVICE_ERROR'))

      const handler = createSearchAgentsHandler(client)
      const result = await handler({ skill: 'go' })

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe('Error: Service unavailable')
    })

    it('stringifies numeric and boolean params', async () => {
      ;(client.searchAgents as MockFn).mockResolvedValue(successResponse([]))

      const handler = createSearchAgentsHandler(client)
      await handler({ skill: 'ts', max_points: 500, limit: 10 })

      expect(client.searchAgents).toHaveBeenCalledWith({
        skill: 'ts',
        max_points: '500',
        limit: '10',
      })
    })

    it('strips null values from params', async () => {
      ;(client.searchAgents as MockFn).mockResolvedValue(successResponse([]))

      const handler = createSearchAgentsHandler(client)
      await handler({ skill: 'rust', zone: null })

      expect(client.searchAgents).toHaveBeenCalledWith({ skill: 'rust' })
    })
  })

  // ─── submit_deliverable ────────────────────────────────────────────

  describe('submit_deliverable', () => {
    it('returns deliverable data on success', async () => {
      const delData = { id: 'del-1', status: 'submitted' }
      ;(client.submitDeliverable as MockFn).mockResolvedValue(successResponse(delData))

      const handler = createSubmitDeliverableHandler(client)
      const result = await handler({ job_id: 'j-1', deliverable_id: 'd-1' })

      expect(result.isError).toBeUndefined()
      expect(JSON.parse(result.content[0]!.text)).toEqual(delData)
    })

    it('returns error when job not found', async () => {
      ;(client.submitDeliverable as MockFn).mockResolvedValue(errorResponse('Job not found', 'NOT_FOUND'))

      const handler = createSubmitDeliverableHandler(client)
      const result = await handler({ job_id: 'bad-id', deliverable_id: 'd-1' })

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toContain('Job not found')
    })

    it('passes optional notes field', async () => {
      ;(client.submitDeliverable as MockFn).mockResolvedValue(successResponse({ id: 'del-2' }))

      const handler = createSubmitDeliverableHandler(client)
      await handler({ job_id: 'j-1', deliverable_id: 'd-1', notes: 'See attached' })

      expect(client.submitDeliverable).toHaveBeenCalledWith('j-1', {
        deliverable_id: 'd-1',
        notes: 'See attached',
      })
    })
  })

  // ─── rate_agent ────────────────────────────────────────────────────

  describe('rate_agent', () => {
    it('returns success result on valid rating', async () => {
      ;(client.rateAgent as MockFn).mockResolvedValue(successResponse({ success: true }))

      const handler = createRateAgentHandler(client)
      const result = await handler({
        job_id: 'j-1',
        helpfulness_score: 4,
        solved: true,
      })

      expect(result.isError).toBeUndefined()
      expect(JSON.parse(result.content[0]!.text)).toEqual({ success: true })
    })

    it('returns error on invalid job', async () => {
      ;(client.rateAgent as MockFn).mockResolvedValue(errorResponse('Job already rated'))

      const handler = createRateAgentHandler(client)
      const result = await handler({
        job_id: 'j-done',
        helpfulness_score: 3,
        solved: false,
      })

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe('Error: Job already rated')
    })

    it('passes optional feedback to client', async () => {
      ;(client.rateAgent as MockFn).mockResolvedValue(successResponse({ ok: true }))

      const handler = createRateAgentHandler(client)
      await handler({
        job_id: 'j-2',
        helpfulness_score: 5,
        solved: true,
        feedback: 'Excellent',
      })

      expect(client.rateAgent).toHaveBeenCalledWith('j-2', {
        helpfulness_score: 5,
        solved: true,
        feedback: 'Excellent',
      })
    })
  })

  // ─── check_wallet ──────────────────────────────────────────────────

  describe('check_wallet', () => {
    it('returns balance data on success', async () => {
      const walletData = { balance: 1250, pending_escrow: 300 }
      ;(client.checkWallet as MockFn).mockResolvedValue(successResponse(walletData))

      const handler = createCheckWalletHandler(client)
      const result = await handler()

      expect(result.isError).toBeUndefined()
      expect(JSON.parse(result.content[0]!.text)).toEqual(walletData)
    })

    it('returns error when not authenticated', async () => {
      ;(client.checkWallet as MockFn).mockResolvedValue(errorResponse('Unauthorized', 'UNAUTHORIZED'))

      const handler = createCheckWalletHandler(client)
      const result = await handler()

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe('Error: Unauthorized')
    })

    it('handler takes no arguments', () => {
      expect(checkWalletTool.inputSchema.properties).toEqual({})
      expect(checkWalletTool.inputSchema.required).toBeUndefined()
    })
  })

  // ─── get_profile ───────────────────────────────────────────────────

  describe('get_profile', () => {
    it('returns agent profile on success', async () => {
      const profile = { id: 'a-1', alias: 'TestBot', tier: 'gold', xp: 5000 }
      ;(client.getProfile as MockFn).mockResolvedValue(successResponse(profile))

      const handler = createGetProfileHandler(client)
      const result = await handler({ agent_id: 'a-1' })

      expect(result.isError).toBeUndefined()
      const parsed = JSON.parse(result.content[0]!.text)
      expect(parsed.alias).toBe('TestBot')
      expect(parsed.tier).toBe('gold')
    })

    it('returns error when agent not found', async () => {
      ;(client.getProfile as MockFn).mockResolvedValue(errorResponse('Agent not found', 'NOT_FOUND'))

      const handler = createGetProfileHandler(client)
      const result = await handler({ agent_id: 'nonexistent' })

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe('Error: Agent not found')
    })

    it('passes undefined when agent_id is omitted', async () => {
      ;(client.getProfile as MockFn).mockResolvedValue(
        errorResponse('Agent ID is required', 'VALIDATION_ERROR'),
      )

      const handler = createGetProfileHandler(client)
      const result = await handler({})

      expect(client.getProfile).toHaveBeenCalledWith(undefined)
      expect(result.isError).toBe(true)
    })
  })

  // ─── list_skills ───────────────────────────────────────────────────

  describe('list_skills', () => {
    it('returns skill list on success', async () => {
      const skills = [{ id: 's-1', name: 'TypeScript' }]
      ;(client.listSkills as MockFn).mockResolvedValue(successResponse(skills))

      const handler = createListSkillsHandler(client)
      const result = await handler({ domain: 'code_generation' })

      expect(result.isError).toBeUndefined()
      expect(JSON.parse(result.content[0]!.text)).toEqual(skills)
    })

    it('returns error on failure', async () => {
      ;(client.listSkills as MockFn).mockResolvedValue(errorResponse('Rate limited', 'RATE_LIMITED'))

      const handler = createListSkillsHandler(client)
      const result = await handler({ domain: 'data_analysis' })

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe('Error: Rate limited')
    })

    it('passes undefined params when args are empty', async () => {
      ;(client.listSkills as MockFn).mockResolvedValue(successResponse([]))

      const handler = createListSkillsHandler(client)
      await handler({})

      expect(client.listSkills).toHaveBeenCalledWith(undefined)
    })

    it('converts all filter params to strings', async () => {
      ;(client.listSkills as MockFn).mockResolvedValue(successResponse([]))

      const handler = createListSkillsHandler(client)
      await handler({
        domain: 'research',
        proficiency: 'expert',
        verified: true,
        min_rating: 4,
        limit: 10,
      })

      expect(client.listSkills).toHaveBeenCalledWith({
        domain: 'research',
        proficiency: 'expert',
        verified: 'true',
        min_rating: '4',
        limit: '10',
      })
    })
  })

  // ─── get_zone_info ─────────────────────────────────────────────────

  describe('get_zone_info', () => {
    it('returns zone data when zone_name provided', async () => {
      const zoneData = { name: 'expert', min_xp: 5000, max_agents: 100 }
      ;(client.getZoneInfo as MockFn).mockResolvedValue(successResponse(zoneData))

      const handler = createGetZoneInfoHandler(client)
      const result = await handler({ zone_name: 'expert' })

      expect(client.getZoneInfo).toHaveBeenCalledWith('expert')
      expect(result.isError).toBeUndefined()
      expect(JSON.parse(result.content[0]!.text)).toEqual(zoneData)
    })

    it('returns all zones when zone_name omitted', async () => {
      const zones = [{ name: 'starter' }, { name: 'expert' }]
      ;(client.getZoneInfo as MockFn).mockResolvedValue(successResponse(zones))

      const handler = createGetZoneInfoHandler(client)
      const result = await handler({})

      expect(client.getZoneInfo).toHaveBeenCalledWith(undefined)
      expect(JSON.parse(result.content[0]!.text)).toHaveLength(2)
    })

    it('returns error on failure', async () => {
      ;(client.getZoneInfo as MockFn).mockResolvedValue(errorResponse('Zone not found'))

      const handler = createGetZoneInfoHandler(client)
      const result = await handler({ zone_name: 'invalid' })

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe('Error: Zone not found')
    })
  })

  // ─── register_tool ─────────────────────────────────────────────────

  describe('register_tool', () => {
    const validToolData = {
      name: 'Claude 3.5',
      provider: 'Anthropic',
      version: '3.5',
      url: 'https://api.anthropic.com',
      category: 'llm',
      capabilities: ['text-generation', 'code-generation'],
      input_formats: ['text'],
      output_formats: ['text'],
      pricing_model: 'per_token',
    }

    it('returns registered tool data on success', async () => {
      const registered = { id: 'tool-new', ...validToolData }
      ;(client.registerTool as MockFn).mockResolvedValue(successResponse(registered))

      const handler = createRegisterToolHandler(client)
      const result = await handler(validToolData)

      expect(result.isError).toBeUndefined()
      expect(JSON.parse(result.content[0]!.text).id).toBe('tool-new')
    })

    it('returns error on duplicate registration', async () => {
      ;(client.registerTool as MockFn).mockResolvedValue(errorResponse('Tool already registered', 'CONFLICT'))

      const handler = createRegisterToolHandler(client)
      const result = await handler(validToolData)

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe('Error: Tool already registered')
    })

    it('passes entire args object directly to client', async () => {
      ;(client.registerTool as MockFn).mockResolvedValue(successResponse({ id: 't-1' }))

      const handler = createRegisterToolHandler(client)
      await handler(validToolData)

      expect(client.registerTool).toHaveBeenCalledWith(validToolData)
    })
  })

  // ─── get_tool_profile ──────────────────────────────────────────────

  describe('get_tool_profile', () => {
    it('returns tool details on success', async () => {
      const tool = { id: 'tool-1', name: 'GPT-4', provider: 'OpenAI', status: 'verified' }
      ;(client.getToolProfile as MockFn).mockResolvedValue(successResponse(tool))

      const handler = createGetToolProfileHandler(client)
      const result = await handler({ tool_id: 'tool-1' })

      expect(result.isError).toBeUndefined()
      const parsed = JSON.parse(result.content[0]!.text)
      expect(parsed.name).toBe('GPT-4')
      expect(parsed.status).toBe('verified')
    })

    it('returns error when tool not found', async () => {
      ;(client.getToolProfile as MockFn).mockResolvedValue(errorResponse('Tool not found', 'NOT_FOUND'))

      const handler = createGetToolProfileHandler(client)
      const result = await handler({ tool_id: 'nonexistent' })

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe('Error: Tool not found')
    })

    it('tool definition requires tool_id', () => {
      expect(getToolProfileTool.inputSchema.required).toEqual(['tool_id'])
    })
  })

  // ─── search_tools ──────────────────────────────────────────────────

  describe('search_tools', () => {
    it('returns search results on success', async () => {
      const tools = [{ id: 't-1', name: 'Copilot' }, { id: 't-2', name: 'Cursor' }]
      ;(client.searchTools as MockFn).mockResolvedValue(successResponse(tools))

      const handler = createSearchToolsHandler(client)
      const result = await handler({ q: 'code', category: 'code_assistant' })

      expect(result.isError).toBeUndefined()
      expect(JSON.parse(result.content[0]!.text)).toHaveLength(2)
    })

    it('returns error on failure', async () => {
      ;(client.searchTools as MockFn).mockResolvedValue(errorResponse('Internal error', 'INTERNAL_ERROR'))

      const handler = createSearchToolsHandler(client)
      const result = await handler({ q: 'test' })

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toBe('Error: Internal error')
    })

    it('passes undefined when no params given', async () => {
      ;(client.searchTools as MockFn).mockResolvedValue(successResponse([]))

      const handler = createSearchToolsHandler(client)
      await handler({})

      expect(client.searchTools).toHaveBeenCalledWith(undefined)
    })

    it('converts status param to string', async () => {
      ;(client.searchTools as MockFn).mockResolvedValue(successResponse([]))

      const handler = createSearchToolsHandler(client)
      await handler({ status: 'verified', provider: 'Anthropic' })

      expect(client.searchTools).toHaveBeenCalledWith({
        status: 'verified',
        provider: 'Anthropic',
      })
    })
  })

  // ─── Cross-cutting concerns ────────────────────────────────────────

  describe('response format consistency', () => {
    it('all success responses have content array with text type', async () => {
      ;(client.checkWallet as MockFn).mockResolvedValue(successResponse({ balance: 100 }))
      ;(client.searchAgents as MockFn).mockResolvedValue(successResponse([]))
      ;(client.listSkills as MockFn).mockResolvedValue(successResponse([]))

      const walletResult = await createCheckWalletHandler(client)()
      const searchResult = await createSearchAgentsHandler(client)({ skill: 'x' })
      const skillsResult = await createListSkillsHandler(client)({})

      for (const result of [walletResult, searchResult, skillsResult]) {
        expect(result.content).toHaveLength(1)
        expect(result.content[0]!.type).toBe('text')
        expect(typeof result.content[0]!.text).toBe('string')
      }
    })

    it('all error responses have isError true and content with error text', async () => {
      ;(client.checkWallet as MockFn).mockResolvedValue(errorResponse('fail1'))
      ;(client.getProfile as MockFn).mockResolvedValue(errorResponse('fail2'))
      ;(client.getToolProfile as MockFn).mockResolvedValue(errorResponse('fail3'))

      const r1 = await createCheckWalletHandler(client)()
      const r2 = await createGetProfileHandler(client)({ agent_id: 'x' })
      const r3 = await createGetToolProfileHandler(client)({ tool_id: 'x' })

      for (const result of [r1, r2, r3]) {
        expect(result.isError).toBe(true)
        expect(result.content).toHaveLength(1)
        expect(result.content[0]!.type).toBe('text')
        expect(result.content[0]!.text).toMatch(/^Error: /)
      }
    })

    it('success responses contain valid JSON in text field', async () => {
      ;(client.postRequest as MockFn).mockResolvedValue(successResponse({ id: 'j-1' }))
      ;(client.rateAgent as MockFn).mockResolvedValue(successResponse({ ok: true }))

      const r1 = await createPostRequestHandler(client)({
        description: 'x',
        acceptance_criteria: 'y',
        point_budget: 1,
      })
      const r2 = await createRateAgentHandler(client)({
        job_id: 'j',
        helpfulness_score: 3,
        solved: false,
      })

      for (const result of [r1, r2]) {
        expect(() => JSON.parse(result.content[0]!.text)).not.toThrow()
      }
    })
  })
})
