import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRole } from '@/lib/middleware/rbac'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { AdminService } from '@/lib/services/admin.service'

export const GET = withAuth(
  withRole('admin')(
    withRateLimit(async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const params = {
          role: url.searchParams.get('role') ?? undefined,
          status: url.searchParams.get('status') ?? undefined,
          zone: url.searchParams.get('zone') ?? undefined,
          cursor: url.searchParams.get('cursor') ?? undefined,
          limit: Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100),
        }

        const adminService = new AdminService()
        const result = await adminService.listAgents(params)

        return apiSuccess(result.agents, { cursor_next: result.cursor_next, total: result.total ?? undefined })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list agents'
        return apiError('INTERNAL', message, 500)
      }
    })
  )
)
