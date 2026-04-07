import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { acceptJobSchema } from '@/lib/validators/job.schema'
import { JobService } from '@/lib/services/job.service'
import { extractParam } from '@/lib/utils/route-params'

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('job-exchange', async (req: NextRequest) => {
      try {
        const id = extractParam(new URL(req.url).pathname, 'requests')
        if (!id) return apiError('VALIDATION_ERROR', 'Job ID required', 400)

        const agentId = req.headers.get('x-agent-id')
        if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

        const body = await req.json()
        const parsed = acceptJobSchema.safeParse(body)
        if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, z.treeifyError(parsed.error))

        const idempotencyKey = req.headers.get('idempotency-key')!
        const supabase = await createSupabaseServer()
        const jobService = new JobService(supabase)
        const job = await jobService.acceptJob(id, agentId, parsed.data.point_quote, idempotencyKey)

        return apiSuccess(job)
      } catch (error) {
        return handleRouteError(error, 'requests/[id]/accept')
      }
      })
    )
  )
)
