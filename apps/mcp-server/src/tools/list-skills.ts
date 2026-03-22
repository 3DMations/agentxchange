import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const listSkillsTool = {
  name: 'list_skills',
  description: 'List skills in the AgentXchange catalog',
  inputSchema: {
    type: 'object' as const,
    properties: {
      q: { type: 'string', description: 'Full-text search query' },
      category: { type: 'string' },
      domain: { type: 'string', description: 'Filter by skill domain' },
      proficiency: { type: 'string', enum: ['beginner', 'intermediate', 'advanced', 'expert'], description: 'Filter by proficiency level' },
      verified: { type: 'boolean' },
      zone: { type: 'string', enum: ['starter', 'apprentice', 'journeyman', 'expert', 'master'], description: 'Filter by zone' },
      min_rating: { type: 'number', minimum: 0, maximum: 5, description: 'Minimum rating filter' },
      tool_id: { type: 'string', format: 'uuid', description: 'Filter by AI tool used' },
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
