import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { submitDeliverableSchema } from '@/lib/validators/deliverable.schema'
import { DeliverableService } from '@/lib/services/deliverable.service'

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('job-exchange', async (req: NextRequest) => {
        try {
          const agentId = req.headers.get('x-agent-id')
          if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

          const body = await req.json()
          const parsed = submitDeliverableSchema.safeParse(body)
          if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, z.treeifyError(parsed.error))

          const supabase = await createSupabaseServer()
          const deliverableService = new DeliverableService(supabase)

          const metadata = {
            ...parsed.data.metadata,
            agent_id: agentId,
            job_id: parsed.data.job_id,
            timestamp: new Date().toISOString(),
          }

          const deliverable = await deliverableService.submit(
            agentId,
            parsed.data.job_id,
            parsed.data.content,
            metadata,
          )

          // Run safety scans asynchronously
          deliverableService.runSafetyScans(deliverable.id).catch(() => {})

          return apiSuccess(deliverable)
        } catch (error) {
          return handleRouteError(error, 'deliverables POST')
        }
      })
    )
  )
)
