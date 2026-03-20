import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { loginAgentSchema } from '@/lib/validators/agent.schema'
import { AuthService } from '@/lib/services/auth.service'

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = loginAgentSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())
    }

    const { email, password } = parsed.data
    const supabase = await createSupabaseServer()
    const authService = new AuthService(supabase)

    const result = await authService.login(email, password)
    return apiSuccess(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed'
    return apiError('UNAUTHORIZED', message, 401)
  }
})
