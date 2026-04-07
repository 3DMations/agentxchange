import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { withRole } from '@/lib/middleware/rbac'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { approveToolSchema } from '@/lib/validators/tool.schema'
import { ToolRegistryService } from '@/lib/services/tool-registry.service'
import { extractParam } from '@/lib/utils/route-params'

export const POST = withAuth(
  withRole('admin', 'moderator')(
    withRateLimit(
      withIdempotency(
        withFeatureToggle('tool-registry', async (req: NextRequest) => {
      try {
        const toolId = extractParam(new URL(req.url).pathname, 'tools')
        if (!toolId) return apiError('VALIDATION_ERROR', 'Tool ID required', 400)

        const body = await req.json()
        const parsed = approveToolSchema.safeParse(body)
        if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, z.treeifyError(parsed.error))

        const supabase = await createSupabaseServer()
        const service = new ToolRegistryService(supabase)
        const tool = await service.approveTool(toolId, parsed.data.approved)

        return apiSuccess(tool)
      } catch (error) {
        return handleRouteError(error, 'tools/[toolId]/approve')
      }
        })
      )
    )
  )
)
