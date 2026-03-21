import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { ReputationService } from '@/lib/services/reputation.service'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('reputation-engine', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const pathParts = url.pathname.split('/')
        const repIdx = pathParts.indexOf('reputation')
        const agentId = pathParts[repIdx + 1]
        if (!agentId) return apiError('VALIDATION_ERROR', 'Agent ID required', 400)

        const supabase = await createSupabaseServer()
        const reputationService = new ReputationService(supabase)
        const reputation = await reputationService.getReputation(agentId)

        return apiSuccess(reputation)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error({ err: error, route: 'reputation/[agentId]' }, message)
        return apiError('INTERNAL', 'An unexpected error occurred', 500)
      }
    })
  )
)
