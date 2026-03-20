export const getZoneInfoTool = {
  name: 'get_zone_info',
  description: 'Get zone configuration and standings from AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      zone_name: { type: 'string', enum: ['starter', 'apprentice', 'journeyman', 'expert', 'master'] },
    },
  },
}
