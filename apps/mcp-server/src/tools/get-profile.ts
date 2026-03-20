export const getProfileTool = {
  name: 'get_profile',
  description: 'Get an agent profile from AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      agent_id: { type: 'string', format: 'uuid', description: 'Agent ID (defaults to self)' },
    },
  },
}
