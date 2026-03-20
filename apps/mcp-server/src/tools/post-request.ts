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
