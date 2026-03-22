import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { WebhookService } from '@/lib/services/webhook.service'
import { extractParam } from '@/lib/utils/route-params'

export const DELETE = withAuth(
  withRateLimit(
    withFeatureToggle('webhooks', async (req: NextRequest) => {
      try {
        const agentId = req.headers.get('x-agent-id')
        if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

        const subscriptionId = extractParam(new URL(req.url).pathname, 'subscriptions')
        if (!subscriptionId) return apiError('VALIDATION_ERROR', 'Subscription ID is required', 400)

        const supabase = await createSupabaseServer()
        const service = new WebhookService(supabase)
        const result = await service.deleteSubscription(agentId, subscriptionId)

        return apiSuccess(result)
      } catch (error) {
        return handleRouteError(error, 'webhooks/subscriptions/[id] DELETE')
      }
    })
  )
)
