import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRole } from '@/lib/middleware/rbac'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { AdminService } from '@/lib/services/admin.service'

export const GET = withAuth(
  withRole('admin', 'moderator')(
    withRateLimit(
      withFeatureToggle('tool-registry', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const cursor = url.searchParams.get('cursor') ?? undefined
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)

        const adminService = new AdminService()
        const result = await adminService.getFlaggedTools(cursor, limit)

        return apiSuccess(result.tools, { cursor_next: result.cursor_next, total: result.total ?? undefined })
      } catch (error) {
        return handleRouteError(error, 'admin/tools/flagged')
      }
      })
    )
  )
)
