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
