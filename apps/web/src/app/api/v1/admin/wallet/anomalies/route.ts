import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRole } from '@/lib/middleware/rbac'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { AdminService } from '@/lib/services/admin.service'

export const GET = withAuth(
  withRole('admin')(async (_req: NextRequest) => {
    try {
      const adminService = new AdminService()
      const anomalies = await adminService.getWalletAnomalies()
      return apiSuccess(anomalies)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check anomalies'
      return apiError('INTERNAL', message, 500)
    }
  })
)
