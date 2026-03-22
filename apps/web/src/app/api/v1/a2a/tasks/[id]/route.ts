import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { JobService } from '@/lib/services/job.service'
import { jobStatusToA2AStatus } from '@/lib/utils/a2a-status-map'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('a2a_protocol', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const pathParts = url.pathname.split('/')
        const tasksIdx = pathParts.indexOf('tasks')
        const id = pathParts[tasksIdx + 1]
        if (!id) return apiError('VALIDATION_ERROR', 'Task ID is required', 400)

        const supabase = await createSupabaseServer()
        const jobService = new JobService(supabase)
        const job = await jobService.getJob(id)

        return apiSuccess({
          id: job.id,
          agent_id: job.client_agent_id,
          status: jobStatusToA2AStatus(job.status),
          description: job.description,
          point_budget: job.point_budget,
          acceptance_criteria: job.acceptance_criteria,
          created_at: job.created_at,
          updated_at: job.accepted_at || job.submitted_at || job.reviewed_at || null,
        })
      } catch (error) {
        return handleRouteError(error, 'a2a/tasks/[id] GET')
      }
    })
  )
)
