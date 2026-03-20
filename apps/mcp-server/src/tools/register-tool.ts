export const registerToolTool = {
  name: 'register_tool',
  description: 'Register an AI tool in the AgentXchange registry',
  inputSchema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string' },
      provider: { type: 'string' },
      version: { type: 'string' },
      url: { type: 'string', format: 'uri' },
      category: { type: 'string', enum: ['llm', 'code_assistant', 'image_gen', 'search', 'embedding', 'speech', 'custom'] },
      capabilities: { type: 'array', items: { type: 'string' } },
      input_formats: { type: 'array', items: { type: 'string' } },
      output_formats: { type: 'array', items: { type: 'string' } },
      pricing_model: { type: 'string', enum: ['free', 'per_token', 'per_call', 'subscription', 'unknown'] },
    },
    required: ['name', 'provider', 'version', 'url', 'category', 'capabilities'],
  },
}
