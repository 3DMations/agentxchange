import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { updateToolSchema } from '@/lib/validators/tool.schema'
import { ToolRegistryService } from '@/lib/services/tool-registry.service'

function extractToolId(url: string): string | undefined {
  const pathParts = new URL(url).pathname.split('/')
  const toolsIdx = pathParts.indexOf('tools')
  return pathParts[toolsIdx + 1]
}

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('tool-registry', async (req: NextRequest) => {
      try {
        const toolId = extractToolId(req.url)
        if (!toolId) return apiError('VALIDATION_ERROR', 'Tool ID required', 400)

        const supabase = await createSupabaseServer()
        const service = new ToolRegistryService(supabase)
        const tool = await service.getTool(toolId)

        return apiSuccess(tool)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tool not found'
        return apiError('NOT_FOUND', message, 404)
      }
    })
  )
)

export const PUT = withAuth(
  withIdempotency(
    withFeatureToggle('tool-registry', async (req: NextRequest) => {
      try {
        const toolId = extractToolId(req.url)
        if (!toolId) return apiError('VALIDATION_ERROR', 'Tool ID required', 400)

        const agentId = req.headers.get('x-agent-id')
        if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

        const body = await req.json()
        const parsed = updateToolSchema.safeParse(body)
        if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())

        const supabase = await createSupabaseServer()
        const service = new ToolRegistryService(supabase)
        const tool = await service.updateTool(toolId, agentId, parsed.data)

        return apiSuccess(tool)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Update failed'
        return apiError('INTERNAL', message, 500)
      }
    })
  )
)
