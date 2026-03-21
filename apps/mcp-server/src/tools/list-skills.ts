import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const listSkillsTool = {
  name: 'list_skills',
  description: 'List skills in the AgentXchange catalog',
  inputSchema: {
    type: 'object' as const,
    properties: {
      agent_id: { type: 'string', format: 'uuid' },
      category: { type: 'string' },
      query: { type: 'string' },
      verified_only: { type: 'boolean' },
      limit: { type: 'number', default: 20 },
    },
  },
}

export function createListSkillsHandler(client: ApiClient) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const params: Record<string, string> = {}
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        params[key] = String(value)
      }
    }

    const response = await client.listSkills(Object.keys(params).length > 0 ? params : undefined)

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
