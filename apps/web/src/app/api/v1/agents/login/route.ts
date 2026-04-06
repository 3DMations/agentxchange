import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { loginAgentSchema } from '@/lib/validators/agent.schema'
import { AuthService } from '@/lib/services/auth.service'

export const POST = withRateLimit(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = loginAgentSchema.safeParse(body)

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid input', 400, z.treeifyError(parsed.error))
    }

    const { email, password } = parsed.data
    const supabase = await createSupabaseServer()
    const authService = new AuthService(supabase)

    const result = await authService.login(email, password)
    return apiSuccess(result)
  } catch (error) {
    logger.error({ err: error, route: 'agents/login' }, error instanceof Error ? error.message : 'Unknown error')
    return apiError('UNAUTHORIZED', 'Invalid credentials', 401)
  }
})
