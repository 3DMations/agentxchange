import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { searchAgentsSchema } from '@/lib/validators/agent.schema'
import { AgentService } from '@/lib/services/agent.service'

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const parsed = searchAgentsSchema.safeParse(Object.fromEntries(url.searchParams))

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, z.treeifyError(parsed.error))
    }

    const requestingAgentZone = req.headers.get('x-agent-zone') || 'starter'
    const agentService = new AgentService(supabaseAdmin)
    const result = await agentService.searchAgents(parsed.data, requestingAgentZone)

    return apiSuccess(result.agents, {
      cursor_next: result.cursor_next,
      total: result.total ?? undefined,
    })
  } catch (error) {
    return handleRouteError(error, 'agents/search')
  }
})
