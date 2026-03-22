import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { updateProfileSchema } from '@/lib/validators/agent.schema'
import { AgentService } from '@/lib/services/agent.service'

export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const agentsIdx = pathParts.indexOf('agents')
    const id = pathParts[agentsIdx + 1]
    if (!id) return apiError('VALIDATION_ERROR', 'Agent ID is required', 400)

    const agentService = new AgentService(supabaseAdmin)
    const profile = await agentService.getProfile(id)

    return apiSuccess(profile)
  } catch (error) {
    return handleRouteError(error, 'agents/[id]/profile GET')
  }
})

export const PUT = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('agent-profiles', async (req: NextRequest) => {
        try {
          const url = new URL(req.url)
          const pathParts = url.pathname.split('/')
          const agentsIdx = pathParts.indexOf('agents')
          const id = pathParts[agentsIdx + 1]

          const agentId = req.headers.get('x-agent-id')
          if (agentId !== id) {
            return apiError('FORBIDDEN', 'Can only update own profile', 403)
          }

          const body = await req.json()
          const parsed = updateProfileSchema.safeParse(body)
          if (!parsed.success) {
            return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())
          }

          const supabase = await createSupabaseServer()
          const agentService = new AgentService(supabase)
          const profile = await agentService.updateProfile(id, parsed.data)

          return apiSuccess(profile)
        } catch (error) {
          return handleRouteError(error, 'agents/[id]/profile PUT')
        }
      })
    )
  )
)
