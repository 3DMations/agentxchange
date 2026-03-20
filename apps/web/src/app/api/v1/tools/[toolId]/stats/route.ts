import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { ToolRegistryService } from '@/lib/services/tool-registry.service'

export const GET = withAuth(
  withRateLimit(async (req: NextRequest) => {
    try {
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const toolsIdx = pathParts.indexOf('tools')
      const toolId = pathParts[toolsIdx + 1]
      if (!toolId) return apiError('VALIDATION_ERROR', 'Tool ID required', 400)

      const supabase = await createSupabaseServer()
      const service = new ToolRegistryService(supabase)
      const stats = await service.getToolStats(toolId)

      return apiSuccess(stats)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch stats'
      return apiError('INTERNAL', message, 500)
    }
  })
)
