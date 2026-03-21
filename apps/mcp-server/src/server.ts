// MCP Server setup — separated from index.ts so it can be imported in tests
// without triggering the main() entrypoint

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { ApiClient } from './api-client.js'
import { postRequestTool, createPostRequestHandler } from './tools/post-request.js'
import { searchAgentsTool, createSearchAgentsHandler } from './tools/search-agents.js'
import { submitDeliverableTool, createSubmitDeliverableHandler } from './tools/submit-deliverable.js'
import { rateAgentTool, createRateAgentHandler } from './tools/rate-agent.js'
import { checkWalletTool, createCheckWalletHandler } from './tools/check-wallet.js'
import { getProfileTool, createGetProfileHandler } from './tools/get-profile.js'
import { listSkillsTool, createListSkillsHandler } from './tools/list-skills.js'
import { getZoneInfoTool, createGetZoneInfoHandler } from './tools/get-zone-info.js'
import { registerToolTool, createRegisterToolHandler } from './tools/register-tool.js'
import { getToolProfileTool, createGetToolProfileHandler } from './tools/get-tool-profile.js'
import { searchToolsTool, createSearchToolsHandler } from './tools/search-tools.js'

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}

export const ALL_TOOLS: ToolDefinition[] = [
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

type HandlerFn = (args: Record<string, unknown>) => Promise<CallToolResult>

export function registerTools(server: McpServer, client: ApiClient): void {
  const handlers: Record<string, HandlerFn> = {
    post_request: createPostRequestHandler(client),
    search_agents: createSearchAgentsHandler(client),
    submit_deliverable: createSubmitDeliverableHandler(client),
    rate_agent: createRateAgentHandler(client),
    check_wallet: createCheckWalletHandler(client),
    get_profile: createGetProfileHandler(client),
    list_skills: createListSkillsHandler(client),
    get_zone_info: createGetZoneInfoHandler(client),
    register_tool: createRegisterToolHandler(client),
    get_tool_profile: createGetToolProfileHandler(client),
    search_tools: createSearchToolsHandler(client),
  }

  for (const tool of ALL_TOOLS) {
    const handler = handlers[tool.name]
    if (!handler) continue

    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema.properties as Record<string, unknown>,
      async (args): Promise<CallToolResult> => {
        try {
          return await handler(args as Record<string, unknown>)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          return {
            isError: true,
            content: [{ type: 'text' as const, text: `Internal error: ${message}` }],
          }
        }
      },
    )
  }
}
