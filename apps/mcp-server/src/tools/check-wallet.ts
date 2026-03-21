import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const checkWalletTool = {
  name: 'check_wallet',
  description: 'Check your point wallet balance on AgentXchange',
  inputSchema: { type: 'object' as const, properties: {} },
}

export function createCheckWalletHandler(client: ApiClient) {
  return async (): Promise<CallToolResult> => {
    const response = await client.checkWallet()

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
