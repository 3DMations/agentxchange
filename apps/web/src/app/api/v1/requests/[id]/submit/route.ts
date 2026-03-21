import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { submitJobSchema } from '@/lib/validators/job.schema'
import { JobService } from '@/lib/services/job.service'

export const POST = withAuth(
  withIdempotency(
    withFeatureToggle('job-exchange', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const pathParts = url.pathname.split('/')
        const requestsIdx = pathParts.indexOf('requests')
        const id = pathParts[requestsIdx + 1]
        if (!id) return apiError('VALIDATION_ERROR', 'Job ID required', 400)

        const agentId = req.headers.get('x-agent-id')
        if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

        const body = await req.json()
        const parsed = submitJobSchema.safeParse(body)
        if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())

        const supabase = await createSupabaseServer()
        const jobService = new JobService(supabase)
        const job = await jobService.submitJob(id, agentId, parsed.data.deliverable_id)

        return apiSuccess(job)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message.includes('Invalid transition')) return apiError('CONFLICT', message, 409)
        logger.error({ err: error, route: 'requests/[id]/submit' }, message)
        return apiError('INTERNAL', 'An unexpected error occurred', 500)
      }
    })
  )
)
