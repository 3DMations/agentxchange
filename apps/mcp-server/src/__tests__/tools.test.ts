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

describe('MCP Tool Handlers', () => {
  let client: ReturnType<typeof createMockClient>

  beforeEach(() => {
    client = createMockClient()
  })

  describe('post_request', () => {
    it('calls client.postRequest with correct arguments', async () => {
      const mockData = { id: 'job-1', status: 'open' };
      (client.postRequest as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse(mockData))

      const handler = createPostRequestHandler(client)
      const result = await handler({
        description: 'Build a widget',
        acceptance_criteria: 'Widget works',
        point_budget: 100,
        required_skills: ['typescript'],
      })

      expect(client.postRequest).toHaveBeenCalledWith({
        description: 'Build a widget',
        acceptance_criteria: 'Widget works',
        point_budget: 100,
        required_skills: ['typescript'],
        tools_required: undefined,
      })
      expect(result.isError).toBeUndefined()
      expect(result.content[0]!.text).toContain('job-1')
    })

    it('returns error when API fails', async () => {
      (client.postRequest as ReturnType<typeof vi.fn>).mockResolvedValue(errorResponse('Insufficient balance'))

      const handler = createPostRequestHandler(client)
      const result = await handler({
        description: 'Build a widget',
        acceptance_criteria: 'Widget works',
        point_budget: 100,
      })

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toContain('Insufficient balance')
    })
  })

  describe('search_agents', () => {
    it('converts args to string params and calls client', async () => {
      const mockData = [{ id: 'agent-1', alias: 'TestAgent' }];
      (client.searchAgents as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse(mockData))

      const handler = createSearchAgentsHandler(client)
      const result = await handler({ skill: 'typescript', limit: 10 })

      expect(client.searchAgents).toHaveBeenCalledWith({ skill: 'typescript', limit: '10' })
      expect(result.content[0]!.text).toContain('agent-1')
    })

    it('omits undefined/null params', async () => {
      (client.searchAgents as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse([]))

      const handler = createSearchAgentsHandler(client)
      await handler({ skill: 'python', tier: undefined })

      expect(client.searchAgents).toHaveBeenCalledWith({ skill: 'python' })
    })
  })

  describe('submit_deliverable', () => {
    it('calls client.submitDeliverable with job_id and deliverable_id', async () => {
      const mockData = { id: 'del-1', status: 'submitted' };
      (client.submitDeliverable as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse(mockData))

      const handler = createSubmitDeliverableHandler(client)
      const result = await handler({
        job_id: 'job-123',
        deliverable_id: 'del-456',
        notes: 'Done',
      })

      expect(client.submitDeliverable).toHaveBeenCalledWith('job-123', {
        deliverable_id: 'del-456',
        notes: 'Done',
      })
      expect(result.content[0]!.text).toContain('del-1')
    })
  })

  describe('rate_agent', () => {
    it('calls client.rateAgent with correct args', async () => {
      (client.rateAgent as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse({ success: true }))

      const handler = createRateAgentHandler(client)
      const result = await handler({
        job_id: 'job-1',
        helpfulness_score: 5,
        solved: true,
        feedback: 'Great work',
      })

      expect(client.rateAgent).toHaveBeenCalledWith('job-1', {
        helpfulness_score: 5,
        solved: true,
        feedback: 'Great work',
      })
      expect(result.isError).toBeUndefined()
    })
  })

  describe('check_wallet', () => {
    it('calls client.checkWallet with no args', async () => {
      const mockData = { balance: 500, currency: 'points' };
      (client.checkWallet as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse(mockData))

      const handler = createCheckWalletHandler(client)
      const result = await handler()

      expect(client.checkWallet).toHaveBeenCalled()
      expect(result.content[0]!.text).toContain('500')
    })
  })

  describe('get_profile', () => {
    it('calls client.getProfile with agent_id', async () => {
      const mockData = { id: 'agent-1', alias: 'TestBot' };
      (client.getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse(mockData))

      const handler = createGetProfileHandler(client)
      const result = await handler({ agent_id: 'agent-1' })

      expect(client.getProfile).toHaveBeenCalledWith('agent-1')
      expect(result.content[0]!.text).toContain('TestBot')
    })

    it('calls client.getProfile without agent_id for self', async () => {
      (client.getProfile as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse({ id: 'me' }))

      const handler = createGetProfileHandler(client)
      await handler({})

      expect(client.getProfile).toHaveBeenCalledWith(undefined)
    })
  })

  describe('list_skills', () => {
    it('passes params to client.listSkills', async () => {
      (client.listSkills as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse([]))

      const handler = createListSkillsHandler(client)
      await handler({ category: 'code_generation', limit: 5 })

      expect(client.listSkills).toHaveBeenCalledWith({ category: 'code_generation', limit: '5' })
    })

    it('passes undefined when no params', async () => {
      (client.listSkills as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse([]))

      const handler = createListSkillsHandler(client)
      await handler({})

      expect(client.listSkills).toHaveBeenCalledWith(undefined)
    })
  })

  describe('get_zone_info', () => {
    it('passes zone_name to client.getZoneInfo', async () => {
      (client.getZoneInfo as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse({ zone: 'expert' }))

      const handler = createGetZoneInfoHandler(client)
      const result = await handler({ zone_name: 'expert' })

      expect(client.getZoneInfo).toHaveBeenCalledWith('expert')
      expect(result.content[0]!.text).toContain('expert')
    })
  })

  describe('register_tool', () => {
    it('passes all args to client.registerTool', async () => {
      const toolData = {
        name: 'GPT-4',
        provider: 'OpenAI',
        version: '1.0',
        url: 'https://api.openai.com',
        category: 'llm',
        capabilities: ['text-generation'],
      };
      (client.registerTool as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse({ id: 'tool-1' }))

      const handler = createRegisterToolHandler(client)
      const result = await handler(toolData)

      expect(client.registerTool).toHaveBeenCalledWith(toolData)
      expect(result.content[0]!.text).toContain('tool-1')
    })
  })

  describe('get_tool_profile', () => {
    it('calls client.getToolProfile with tool_id', async () => {
      (client.getToolProfile as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse({ id: 'tool-1', name: 'GPT-4' }))

      const handler = createGetToolProfileHandler(client)
      const result = await handler({ tool_id: 'tool-1' })

      expect(client.getToolProfile).toHaveBeenCalledWith('tool-1')
      expect(result.content[0]!.text).toContain('GPT-4')
    })
  })

  describe('search_tools', () => {
    it('converts args to string params', async () => {
      (client.searchTools as ReturnType<typeof vi.fn>).mockResolvedValue(successResponse([]))

      const handler = createSearchToolsHandler(client)
      await handler({ query: 'llm', category: 'llm', limit: 5 })

      expect(client.searchTools).toHaveBeenCalledWith({ query: 'llm', category: 'llm', limit: '5' })
    })
  })
})
