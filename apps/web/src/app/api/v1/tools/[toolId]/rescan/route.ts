import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { ToolRegistryService } from '@/lib/services/tool-registry.service'

export const POST = withAuth(
  withIdempotency(async (req: NextRequest) => {
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
      const message = error instanceof Error ? error.message : 'Rescan failed'
      return apiError('INTERNAL', message, 500)
    }
  })
)
