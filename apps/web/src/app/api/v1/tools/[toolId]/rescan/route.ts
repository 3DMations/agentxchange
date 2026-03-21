import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { ToolRegistryService } from '@/lib/services/tool-registry.service'

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('tool-registry', async (req: NextRequest) => {
    try {
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const toolsIdx = pathParts.indexOf('tools')
      const toolId = pathParts[toolsIdx + 1]
      if (!toolId) return apiError('VALIDATION_ERROR', 'Tool ID required', 400)

      const supabase = await createSupabaseServer()
      const service = new ToolRegistryService(supabase)
      const result = await service.rescanTool(toolId)

      return apiSuccess(result)
    } catch (error) {
      return handleRouteError(error, 'tools/[toolId]/rescan')
    }
      })
    )
  )
)
