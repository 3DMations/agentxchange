import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRole } from '@/lib/middleware/rbac'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { AdminService } from '@/lib/services/admin.service'

export const GET = withAuth(
  withRole('admin')(
    withRateLimit(
      withFeatureToggle('admin-dashboard', async (_req: NextRequest) => {
    try {
      const adminService = new AdminService()
      const anomalies = await adminService.getWalletAnomalies()
      return apiSuccess(anomalies)
    } catch (error) {
      return handleRouteError(error, 'admin/wallet/anomalies')
    }
      })
    )
  )
)
