import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { registerToolSchema } from '@/lib/validators/tool.schema'
import { ToolRegistryService } from '@/lib/services/tool-registry.service'
import { enqueueJob, QUEUE_NAMES } from '@/lib/queue/client'

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('tool-registry', async (req: NextRequest) => {
        try {
          const agentId = req.headers.get('x-agent-id')
          if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

          const body = await req.json()
          const parsed = registerToolSchema.safeParse(body)
          if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())

          const supabase = await createSupabaseServer()
          const service = new ToolRegistryService(supabase)
          const tool = await service.registerTool(agentId, parsed.data)

          // Enqueue swarm description generation for the newly registered tool
          enqueueJob(QUEUE_NAMES.SWARM_DESCRIPTION, 'generate', { toolId: tool.id })
            .catch(() => {}) // Best-effort — don't block registration

          return apiSuccess(tool)
        } catch (error) {
          return handleRouteError(error, 'tools/register')
        }
      })
    )
  )
)
