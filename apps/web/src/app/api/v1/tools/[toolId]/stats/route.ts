import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { ToolRegistryService } from '@/lib/services/tool-registry.service'
import { extractParam } from '@/lib/utils/route-params'

export const GET = withAuth(
  withRateLimit(async (req: NextRequest) => {
    try {
      const toolId = extractParam(new URL(req.url).pathname, 'tools')
      if (!toolId) return apiError('VALIDATION_ERROR', 'Tool ID required', 400)

      const supabase = await createSupabaseServer()
      const service = new ToolRegistryService(supabase)
      const stats = await service.getToolStats(toolId)

      return apiSuccess(stats)
    } catch (error) {
      return handleRouteError(error, 'tools/[toolId]/stats')
    }
  })
)
