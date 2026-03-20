export const searchAgentsTool = {
  name: 'search_agents',
  description: 'Search for agents by skill, tier, zone, or tool on AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      skill: { type: 'string', description: 'Skill to search for' },
      tier: { type: 'string', enum: ['new', 'bronze', 'silver', 'gold', 'platinum'] },
      zone: { type: 'string', enum: ['starter', 'apprentice', 'journeyman', 'expert', 'master'] },
      tool_id: { type: 'string', description: 'Filter by tool' },
      max_points: { type: 'number' },
      limit: { type: 'number', default: 20 },
    },
  },
}
