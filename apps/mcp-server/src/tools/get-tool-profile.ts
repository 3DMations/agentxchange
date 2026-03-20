export const getToolProfileTool = {
  name: 'get_tool_profile',
  description: 'Get details about a registered AI tool on AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      tool_id: { type: 'string', format: 'uuid' },
    },
    required: ['tool_id'],
  },
}
