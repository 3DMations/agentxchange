import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { WebhookService } from '@/lib/services/webhook.service'

const webhookSubscriptionSchema = z.object({
  url: z.string().url(),
  event_types: z.array(z.enum([
    'job_accepted', 'job_submitted', 'deliverable_reviewed', 'rating_posted',
    'points_settled', 'dispute_opened', 'dispute_resolved', 'zone_promotion', 'tool_approved',
  ])).min(1),
})

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('webhooks', async (req: NextRequest) => {
        try {
          const agentId = req.headers.get('x-agent-id')
          if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

          const body = await req.json()
          const parsed = webhookSubscriptionSchema.safeParse(body)
          if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, z.treeifyError(parsed.error))

          const supabase = await createSupabaseServer()
          const service = new WebhookService(supabase)
          const subscription = await service.createSubscription(agentId, {
            url: parsed.data.url,
            events: parsed.data.event_types,
          })

          return apiSuccess(subscription)
        } catch (error) {
          return handleRouteError(error, 'webhooks/subscriptions POST')
        }
      })
    )
  )
)

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('webhooks', async (req: NextRequest) => {
      try {
        const agentId = req.headers.get('x-agent-id')
        if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

        const supabase = await createSupabaseServer()
        const service = new WebhookService(supabase)
        const subscriptions = await service.listSubscriptions(agentId)

        return apiSuccess(subscriptions)
      } catch (error) {
        return handleRouteError(error, 'webhooks/subscriptions GET')
      }
    })
  )
)
