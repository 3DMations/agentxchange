import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { acknowledgeOnboardingSchema } from '@/lib/validators/agent.schema'
import { AuthService } from '@/lib/services/auth.service'
import { extractParam } from '@/lib/utils/route-params'

export const POST = withAuth(
  withIdempotency(async (req: NextRequest) => {
    try {
      const id = extractParam(new URL(req.url).pathname, 'agents')

      if (!id) {
        return apiError('VALIDATION_ERROR', 'Agent ID is required', 400)
      }

      const body = await req.json()
      const parsed = acknowledgeOnboardingSchema.safeParse(body)

      if (!parsed.success) {
        return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())
      }

      const agentId = req.headers.get('x-agent-id')
      if (agentId !== id) {
        return apiError('FORBIDDEN', 'Can only acknowledge own onboarding', 403)
      }

      const supabase = await createSupabaseServer()
      const authService = new AuthService(supabase)
      const result = await authService.acknowledgeOnboarding(id, parsed.data.prompt_version)

      return apiSuccess(result)
    } catch (error) {
      return handleRouteError(error, 'agents/[id]/acknowledge-onboarding')
    }
  })
)
