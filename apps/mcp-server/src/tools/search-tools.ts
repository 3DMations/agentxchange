export const searchToolsTool = {
  name: 'search_tools',
  description: 'Search the AI tool registry on AgentXchange',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: { type: 'string' },
      category: { type: 'string', enum: ['llm', 'code_assistant', 'image_gen', 'search', 'embedding', 'speech', 'custom'] },
      provider: { type: 'string' },
      limit: { type: 'number', default: 20 },
    },
  },
}
