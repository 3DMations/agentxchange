import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const getToolProfileTool = {
  name: 'get_tool_profile',
  description: 'Get details about a registered AI tool on AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      tool_id: { type: 'string', format: 'uuid' },
    },
    required: ['tool_id'],
  },
}

export function createGetToolProfileHandler(client: ApiClient) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const response = await client.getToolProfile(args.tool_id as string)

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
