import { describe, it, expect, vi } from 'vitest'
import { ALL_TOOLS, registerTools } from '../server.js'
import type { ApiClient } from '../api-client.js'

// Mock McpServer
function createMockServer() {
  return {
    tool: vi.fn(),
    connect: vi.fn(),
    close: vi.fn(),
  }
}

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

describe('MCP Server', () => {
  describe('ALL_TOOLS', () => {
    it('exports 11 tool definitions', () => {
      expect(ALL_TOOLS).toHaveLength(11)
    })

    it('all tools have name, description, and inputSchema', () => {
      for (const tool of ALL_TOOLS) {
        expect(tool.name).toBeTruthy()
        expect(tool.description).toBeTruthy()
        expect(tool.inputSchema).toBeDefined()
        expect(tool.inputSchema.type).toBe('object')
      }
    })

    it('all tool names are unique', () => {
      const names = ALL_TOOLS.map(t => t.name)
      expect(new Set(names).size).toBe(names.length)
    })

    const expectedTools = [
      'post_request',
      'search_agents',
      'submit_deliverable',
      'rate_agent',
      'check_wallet',
      'get_profile',
      'list_skills',
      'get_zone_info',
      'register_tool',
      'get_tool_profile',
      'search_tools',
    ]

    it.each(expectedTools)('includes %s tool', (toolName) => {
      expect(ALL_TOOLS.find(t => t.name === toolName)).toBeDefined()
    })
  })

  describe('registerTools', () => {
    it('registers all 11 tools with the server', () => {
      const server = createMockServer()
      const client = createMockClient()

      registerTools(server as never, client)

      expect(server.tool).toHaveBeenCalledTimes(11)
    })

    it('registers tools with correct names and descriptions', () => {
      const server = createMockServer()
      const client = createMockClient()

      registerTools(server as never, client)

      const registeredNames = server.tool.mock.calls.map((call: unknown[]) => call[0])
      for (const tool of ALL_TOOLS) {
        expect(registeredNames).toContain(tool.name)
      }
    })

    it('wraps handlers with error catching', async () => {
      const server = createMockServer()
      const client = createMockClient();
      (client.checkWallet as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network failure'))

      registerTools(server as never, client)

      // Find the check_wallet registration
      const walletCall = server.tool.mock.calls.find((call: unknown[]) => call[0] === 'check_wallet')
      expect(walletCall).toBeDefined()

      // The handler is the 4th argument (name, description, schema, handler)
      const handler = walletCall![3] as (args: Record<string, unknown>) => Promise<unknown>
      const result = await handler({}) as { isError: boolean; content: Array<{ text: string }> }

      expect(result.isError).toBe(true)
      expect(result.content[0]!.text).toContain('Network failure')
    })
  })
})
