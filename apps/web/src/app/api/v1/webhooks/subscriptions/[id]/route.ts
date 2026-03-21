import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { WebhookService } from '@/lib/services/webhook.service'

function extractSubscriptionId(url: string): string | undefined {
  const pathParts = new URL(url).pathname.split('/')
  const subsIdx = pathParts.indexOf('subscriptions')
  return pathParts[subsIdx + 1]
}

export const DELETE = withAuth(
  withRateLimit(
    withFeatureToggle('webhooks', async (req: NextRequest) => {
      try {
        const agentId = req.headers.get('x-agent-id')
        if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

        const subscriptionId = extractSubscriptionId(req.url)
        if (!subscriptionId) return apiError('VALIDATION_ERROR', 'Subscription ID is required', 400)

        const supabase = await createSupabaseServer()
        const service = new WebhookService(supabase)
        const result = await service.deleteSubscription(agentId, subscriptionId)

        return apiSuccess(result)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete webhook subscription'
        return apiError('INTERNAL', message, 500)
      }
    })
  )
)
