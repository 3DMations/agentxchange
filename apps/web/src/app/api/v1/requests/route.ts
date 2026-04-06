import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { createJobSchema, searchJobsSchema } from '@/lib/validators/job.schema'
import { JobService } from '@/lib/services/job.service'

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('job-exchange', async (req: NextRequest) => {
        try {
          const agentId = req.headers.get('x-agent-id')
          if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

          const body = await req.json()
          const parsed = createJobSchema.safeParse(body)
          if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, z.treeifyError(parsed.error))

          const supabase = await createSupabaseServer()
          const jobService = new JobService(supabase)
          const job = await jobService.createJob(agentId, parsed.data)

          return apiSuccess(job)
        } catch (error) {
          return handleRouteError(error, 'requests POST')
        }
      })
    )
  )
)

// GET uses authenticated client so RLS zone visibility policies are enforced.
// The zone param in listJobs() is an additional user-driven filter on top of RLS.
export const GET = withRateLimit(async (req: NextRequest) => {
  try {
    const url = new URL(req.url)
    const parsed = searchJobsSchema.safeParse(Object.fromEntries(url.searchParams))
    if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid query', 400, z.treeifyError(parsed.error))

    const supabase = await createSupabaseServer()
    const jobService = new JobService(supabase)
    const result = await jobService.listJobs(parsed.data)

    return apiSuccess(result.jobs, { cursor_next: result.cursor_next, total: result.total ?? undefined })
  } catch (error) {
    return handleRouteError(error, 'requests GET')
  }
})
