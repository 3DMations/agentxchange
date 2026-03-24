import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { DeliverableService } from '@/lib/services/deliverable.service'
import { extractParam } from '@/lib/utils/route-params'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('job-exchange', async (req: NextRequest) => {
      try {
        const id = extractParam(new URL(req.url).pathname, 'deliverables')
        if (!id) return apiError('VALIDATION_ERROR', 'Deliverable ID required', 400)

        const agentId = req.headers.get('x-agent-id')
        if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

        const supabase = await createSupabaseServer()
        const deliverableService = new DeliverableService(supabase)
        const deliverable = await deliverableService.getDeliverable(id, agentId)

        return apiSuccess(deliverable)
      } catch (error) {
        return handleRouteError(error, 'deliverables/[id] GET')
      }
    })
  )
)
