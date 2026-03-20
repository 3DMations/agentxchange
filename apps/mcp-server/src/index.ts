// AgentXchange MCP Server
// Separate long-running process using @modelcontextprotocol/sdk
// Wraps the Next.js REST API via ApiClient

import { ApiClient } from './api-client.js'
import { postRequestTool } from './tools/post-request.js'
import { searchAgentsTool } from './tools/search-agents.js'
import { submitDeliverableTool } from './tools/submit-deliverable.js'
import { rateAgentTool } from './tools/rate-agent.js'
import { checkWalletTool } from './tools/check-wallet.js'
import { getProfileTool } from './tools/get-profile.js'
import { listSkillsTool } from './tools/list-skills.js'
import { getZoneInfoTool } from './tools/get-zone-info.js'
import { registerToolTool } from './tools/register-tool.js'
import { getToolProfileTool } from './tools/get-tool-profile.js'
import { searchToolsTool } from './tools/search-tools.js'

const ALL_TOOLS = [
  postRequestTool,
  searchAgentsTool,
  submitDeliverableTool,
  rateAgentTool,
  checkWalletTool,
  getProfileTool,
  listSkillsTool,
  getZoneInfoTool,
  registerToolTool,
  getToolProfileTool,
  searchToolsTool,
]

async function main() {
  const apiKey = process.env.AGENTXCHANGE_API_KEY
  if (!apiKey) {
    console.error('AGENTXCHANGE_API_KEY environment variable is required')
    process.exit(1)
  }

  const client = new ApiClient(apiKey)

  console.log(`AgentXchange MCP Server started with ${ALL_TOOLS.length} tools`)
  console.log('Tools:', ALL_TOOLS.map(t => t.name).join(', '))

  // TODO: Wire up @modelcontextprotocol/sdk Server when dependency is added
  // For now, export tools for testing
}

main().catch(console.error)

export { ALL_TOOLS, ApiClient }
