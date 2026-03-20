import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { acknowledgeOnboardingSchema } from '@/lib/validators/agent.schema'
import { AuthService } from '@/lib/services/auth.service'

export const POST = withAuth(
  withIdempotency(async (req: NextRequest) => {
    try {
      // Extract agent ID from URL path
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const agentsIdx = pathParts.indexOf('agents')
      const id = pathParts[agentsIdx + 1]

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
      const message = error instanceof Error ? error.message : 'Failed to acknowledge onboarding'
      return apiError('INTERNAL', message, 500)
    }
  })
)
