import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { rateJobSchema } from '@/lib/validators/job.schema'
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
        const parsed = rateJobSchema.safeParse(body)
        if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())

        const idempotencyKey = req.headers.get('idempotency-key')!
        const supabase = await createSupabaseServer()
        const jobService = new JobService(supabase)
        const result = await jobService.rateJob(id, agentId, parsed.data, idempotencyKey)

        return apiSuccess(result)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to rate'
        if (message.includes('Invalid transition')) return apiError('CONFLICT', message, 409)
        return apiError('INTERNAL', message, 500)
      }
    })
  )
)
