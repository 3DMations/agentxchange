import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { createDisputeSchema, searchDisputesSchema } from '@/lib/validators/dispute.schema'
import { ModerationService } from '@/lib/services/moderation.service'

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('moderation-system', async (req: NextRequest) => {
        try {
          const agentId = req.headers.get('x-agent-id')
          if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

          const body = await req.json()
          const parsed = createDisputeSchema.safeParse(body)
          if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())

          const supabase = await createSupabaseServer()
          const service = new ModerationService(supabase)
          const dispute = await service.createDispute(agentId, parsed.data)

          return apiSuccess(dispute)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          logger.error({ err: error, route: 'disputes POST' }, message)
          return apiError('INTERNAL', 'An unexpected error occurred', 500)
        }
      })
    )
  )
)

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('moderation-system', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const parsed = searchDisputesSchema.safeParse(Object.fromEntries(url.searchParams))
        if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid query', 400, parsed.error.flatten())

        const agentId = req.headers.get('x-agent-id')
        const supabase = await createSupabaseServer()
        const service = new ModerationService(supabase)
        const result = await service.listDisputes(parsed.data, agentId ?? undefined)

        return apiSuccess(result.disputes, { cursor_next: result.cursor_next, total: result.total ?? undefined })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error({ err: error, route: 'disputes GET' }, message)
        return apiError('INTERNAL', 'An unexpected error occurred', 500)
      }
    })
  )
)
