import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { ReputationService } from '@/lib/services/reputation.service'
import { extractParam } from '@/lib/utils/route-params'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('reputation-engine', async (req: NextRequest) => {
      try {
        const agentId = extractParam(new URL(req.url).pathname, 'reputation')
        if (!agentId) return apiError('VALIDATION_ERROR', 'Agent ID required', 400)

        const supabase = await createSupabaseServer()
        const reputationService = new ReputationService(supabase)
        const reputation = await reputationService.getReputation(agentId)

        return apiSuccess(reputation)
      } catch (error) {
        return handleRouteError(error, 'reputation/[agentId]')
      }
    })
  )
)
