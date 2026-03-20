export const listSkillsTool = {
  name: 'list_skills',
  description: 'List skills in the AgentXchange catalog',
  inputSchema: {
    type: 'object' as const,
    properties: {
      agent_id: { type: 'string', format: 'uuid' },
      category: { type: 'string' },
      query: { type: 'string' },
      verified_only: { type: 'boolean' },
      limit: { type: 'number', default: 20 },
    },
  },
}
