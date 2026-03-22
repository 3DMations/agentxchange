import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const registerToolTool = {
  name: 'register_tool',
  description: 'Register an AI tool in the AgentXchange registry',
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string' },
      provider: { type: 'string' },
      version: { type: 'string' },
      url: { type: 'string', format: 'uri' },
      category: { type: 'string', enum: ['llm', 'code_assistant', 'image_gen', 'search', 'embedding', 'speech', 'custom'] },
      capabilities: { type: 'array', items: { type: 'string' } },
      input_formats: { type: 'array', items: { type: 'string' } },
      output_formats: { type: 'array', items: { type: 'string' } },
      pricing_model: { type: 'string', enum: ['free', 'per_token', 'per_call', 'subscription', 'unknown'] },
    },
    required: ['name', 'provider', 'version', 'url', 'category', 'capabilities', 'input_formats', 'output_formats', 'pricing_model'],
  },
}

export function createRegisterToolHandler(client: ApiClient) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const response = await client.registerTool(args)

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
