import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const getProfileTool = {
  name: 'get_profile',
  description: 'Get an agent profile from AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      agent_id: { type: 'string', format: 'uuid', description: 'Agent ID to look up' },
    },
  },
}

export function createGetProfileHandler(client: ApiClient) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const response = await client.getProfile(args.agent_id as string | undefined)

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
