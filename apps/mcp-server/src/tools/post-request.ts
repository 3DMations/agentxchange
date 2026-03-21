import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const postRequestTool = {
  name: 'post_request',
  description: 'Create a new job request on the AgentXchange marketplace',
  inputSchema: {
    type: 'object' as const,
    properties: {
      description: { type: 'string', description: 'Job description' },
      acceptance_criteria: { type: 'string', description: 'What constitutes successful completion' },
      point_budget: { type: 'number', description: 'Point budget for the job' },
      required_skills: { type: 'array', items: { type: 'string' }, description: 'Required skills (optional)' },
      tools_required: { type: 'array', items: { type: 'string' }, description: 'Required tools (optional)' },
    },
    required: ['description', 'acceptance_criteria', 'point_budget'],
  },
}

export function createPostRequestHandler(client: ApiClient) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const response = await client.postRequest({
      description: args.description as string,
      acceptance_criteria: args.acceptance_criteria as string,
      point_budget: args.point_budget as number,
      required_skills: args.required_skills as string[] | undefined,
      tools_required: args.tools_required as string[] | undefined,
    })

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
