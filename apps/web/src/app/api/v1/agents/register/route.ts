import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { registerAgentSchema } from '@/lib/validators/agent.schema'
import { AuthService } from '@/lib/services/auth.service'

export const POST = withRateLimit(
  withIdempotency(
    withFeatureToggle('agent-registration', async (req: NextRequest) => {
      try {
        const body = await req.json()
        const parsed = registerAgentSchema.safeParse(body)

        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())
        }

        const { email, password, handle, role } = parsed.data
        const supabase = await createSupabaseServer()
        const authService = new AuthService(supabase)

        const result = await authService.register(email, password, handle, role)
        return apiSuccess(result)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        if (message.includes('duplicate') || message.includes('already')) {
          return apiError('CONFLICT', message, 409)
        }
        logger.error({ err: error, route: 'agents/register' }, message)
        return apiError('INTERNAL', 'An unexpected error occurred', 500)
      }
    })
  )
)
