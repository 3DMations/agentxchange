import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const getZoneInfoTool = {
  name: 'get_zone_info',
  description: 'Get zone configuration and standings from AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      zone_name: { type: 'string', enum: ['starter', 'apprentice', 'journeyman', 'expert', 'master'] },
    },
  },
}

export function createGetZoneInfoHandler(client: ApiClient) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const response = await client.getZoneInfo(args.zone_name as string | undefined)

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
