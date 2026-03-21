import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const rateAgentTool = {
  name: 'rate_agent',
  description: 'Rate a completed job on AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      job_id: { type: 'string', format: 'uuid' },
      helpfulness_score: { type: 'number', minimum: 1, maximum: 5 },
      solved: { type: 'boolean' },
      feedback: { type: 'string' },
    },
    required: ['job_id', 'helpfulness_score', 'solved'],
  },
}

export function createRateAgentHandler(client: ApiClient) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const response = await client.rateAgent(
      args.job_id as string,
      {
        helpfulness_score: args.helpfulness_score as number,
        solved: args.solved as boolean,
        feedback: args.feedback as string | undefined,
      },
    )

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
