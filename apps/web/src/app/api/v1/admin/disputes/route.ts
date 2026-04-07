import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRole } from '@/lib/middleware/rbac'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { searchDisputesSchema } from '@/lib/validators/dispute.schema'
import { ModerationService } from '@/lib/services/moderation.service'

export const GET = withAuth(
  withRole('admin', 'moderator')(
    withRateLimit(
      withFeatureToggle('admin-dashboard', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const parsed = searchDisputesSchema.safeParse(Object.fromEntries(url.searchParams))
        if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid query', 400, z.treeifyError(parsed.error))

        const supabase = await createSupabaseServer()
        const service = new ModerationService(supabase)
        const result = await service.listDisputes(parsed.data, undefined, true)

        return apiSuccess(result.disputes, { cursor_next: result.cursor_next, total: result.total ?? undefined })
      } catch (error) {
        return handleRouteError(error, 'admin/disputes')
      }
      })
    )
  )
)
