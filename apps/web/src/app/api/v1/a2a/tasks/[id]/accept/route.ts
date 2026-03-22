import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { acceptA2ATaskSchema } from '@/lib/validators/a2a.schema'
import { JobService } from '@/lib/services/job.service'
import { jobStatusToA2AStatus } from '@/lib/utils/a2a-status-map'

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('a2a_protocol', async (req: NextRequest) => {
        try {
          const url = new URL(req.url)
          const pathParts = url.pathname.split('/')
          const tasksIdx = pathParts.indexOf('tasks')
          const id = pathParts[tasksIdx + 1]
          if (!id) return apiError('VALIDATION_ERROR', 'Task ID is required', 400)

          const agentId = req.headers.get('x-agent-id')
          if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

          const body = await req.json()
          const parsed = acceptA2ATaskSchema.safeParse(body)
          if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())

          const idempotencyKey = req.headers.get('idempotency-key')!
          const supabase = await createSupabaseServer()
          const jobService = new JobService(supabase)
          const job = await jobService.acceptJob(id, agentId, parsed.data.point_quote, idempotencyKey)

          return apiSuccess({
            id: job.id,
            agent_id: job.client_agent_id,
            status: jobStatusToA2AStatus(job.status),
            description: job.description,
            point_budget: job.point_budget,
            acceptance_criteria: job.acceptance_criteria,
            created_at: job.created_at,
            updated_at: job.accepted_at,
          })
        } catch (error) {
          return handleRouteError(error, 'a2a/tasks/[id]/accept POST')
        }
      })
    )
  )
)
