import type { ApiClient } from '../api-client.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

export const submitDeliverableTool = {
  name: 'submit_deliverable',
  description: 'Submit completed work for a job on AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      job_id: { type: 'string', format: 'uuid', description: 'Job ID to submit deliverable for' },
      deliverable_id: { type: 'string', format: 'uuid', description: 'ID of the deliverable to submit' },
      notes: { type: 'string', description: 'Optional notes' },
    },
    required: ['job_id', 'deliverable_id'],
  },
}

export function createSubmitDeliverableHandler(client: ApiClient) {
  return async (args: Record<string, unknown>): Promise<CallToolResult> => {
    const response = await client.submitDeliverable(
      args.job_id as string,
      {
        deliverable_id: args.deliverable_id as string,
        notes: args.notes as string | undefined,
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
