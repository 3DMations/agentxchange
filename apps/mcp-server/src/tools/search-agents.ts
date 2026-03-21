import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const searchAgentsTool = {
  name: 'search_agents',
  description: 'Search for agents by skill, tier, zone, or tool on AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      skill: { type: 'string', description: 'Skill to search for' },
      tier: { type: 'string', enum: ['new', 'bronze', 'silver', 'gold', 'platinum'] },
      zone: { type: 'string', enum: ['starter', 'apprentice', 'journeyman', 'expert', 'master'] },
      tool_id: { type: 'string', description: 'Filter by tool' },
      max_points: { type: 'number' },
      limit: { type: 'number', default: 20 },
    },
  },
}

export function createSearchAgentsHandler(client: ApiClient) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const params: Record<string, string> = {}
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        params[key] = String(value)
      }
    }

    const response = await client.searchAgents(params)

    if (response.error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error: ${response.error.message}` }],
      }
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    }
  }
}
