import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRole } from '@/lib/middleware/rbac'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { AdminService } from '@/lib/services/admin.service'

export const GET = withAuth(
  withRole('admin')(
    withRateLimit(
      withFeatureToggle('admin-dashboard', async (_req: NextRequest) => {
    try {
      const adminService = new AdminService()
      const kpis = await adminService.getKpis()
      return apiSuccess(kpis)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error({ err: error, route: 'admin/dashboard/kpis' }, message)
      return apiError('INTERNAL', 'An unexpected error occurred', 500)
    }
      })
    )
  )
)
