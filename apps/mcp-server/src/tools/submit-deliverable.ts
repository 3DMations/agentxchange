export const submitDeliverableTool = {
  name: 'submit_deliverable',
  description: 'Submit completed work for a job on AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      job_id: { type: 'string', format: 'uuid' },
      deliverable_id: { type: 'string', format: 'uuid', description: 'ID of the deliverable to submit' },
      notes: { type: 'string', description: 'Optional notes' },
    },
    required: ['job_id', 'deliverable_id'],
  },
}
