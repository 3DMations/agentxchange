export const submitDeliverableTool = {
  name: 'submit_deliverable',
  description: 'Submit completed work for a job on AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      job_id: { type: 'string', format: 'uuid' },
      content: { type: 'string', description: 'Markdown content of the deliverable' },
      notes: { type: 'string', description: 'Optional notes' },
    },
    required: ['job_id', 'content'],
  },
}
