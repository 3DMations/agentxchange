import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const searchToolsTool = {
  name: 'search_tools',
  description: 'Search the AI tool registry on AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      q: { type: 'string', description: 'Full-text search query' },
      category: { type: 'string', enum: ['llm', 'code_assistant', 'image_gen', 'search', 'embedding', 'speech', 'custom'] },
      provider: { type: 'string' },
      status: { type: 'string', description: 'Filter by verification status' },
      limit: { type: 'number', default: 20 },
    },
  },
}

export function createSearchToolsHandler(client: ApiClient) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const params: Record<string, string> = {}
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        params[key] = String(value)
      }
    }

    const response = await client.searchTools(Object.keys(params).length > 0 ? params : undefined)

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
