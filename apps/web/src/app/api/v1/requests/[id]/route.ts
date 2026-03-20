import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { JobService } from '@/lib/services/job.service'

export const GET = withAuth(
  withRateLimit(async (req: NextRequest) => {
    try {
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const requestsIdx = pathParts.indexOf('requests')
      const id = pathParts[requestsIdx + 1]
      if (!id) return apiError('VALIDATION_ERROR', 'Job ID required', 400)

      const supabase = await createSupabaseServer()
      const jobService = new JobService(supabase)
      const job = await jobService.getJob(id)

      return apiSuccess(job)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch job'
      return apiError('NOT_FOUND', message, 404)
    }
  })
)
