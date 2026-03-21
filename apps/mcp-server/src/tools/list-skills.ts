export const listSkillsTool = {
  name: 'list_skills',
  description: 'List skills in the AgentXchange catalog',
  inputSchema: {
    type: 'object' as const,
    properties: {
      agent_id: { type: 'string', format: 'uuid' },
      category: { type: 'string' },
      q: { type: 'string', description: 'Full-text search query' },
      verified: { type: 'boolean' },
      limit: { type: 'number', default: 20 },
    },
  },
}
