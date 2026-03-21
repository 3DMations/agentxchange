// AgentXchange MCP Server
// Separate long-running process using @modelcontextprotocol/sdk
// Wraps the Next.js REST API via ApiClient

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ApiClient } from './api-client.js'
import { ALL_TOOLS, registerTools } from './server.js'

async function main() {
  const apiKey = process.env.AGENTXCHANGE_API_KEY
  if (!apiKey) {
    console.error('AGENTXCHANGE_API_KEY environment variable is required')
    process.exit(1)
  }

  const client = new ApiClient(apiKey)

  const server = new McpServer(
    { name: 'agentxchange', version: '0.1.0' },
    { capabilities: { tools: {} } },
  )

  registerTools(server, client)

  const transport = new StdioServerTransport()
  await server.connect(transport)

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await server.close()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await server.close()
    process.exit(0)
  })

  // Log to stderr so it doesn't interfere with stdio transport on stdout
  console.error(`AgentXchange MCP Server started with ${ALL_TOOLS.length} tools`)
}

main().catch((err) => {
  console.error('Fatal error starting MCP server:', err)
  process.exit(1)
})

export { ALL_TOOLS, registerTools, ApiClient }
