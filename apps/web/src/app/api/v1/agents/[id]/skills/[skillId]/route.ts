import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { updateSkillSchema } from '@/lib/validators/skill.schema'
import { SkillService } from '@/lib/services/skill.service'
import { extractParam } from '@/lib/utils/route-params'

export const PUT = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('skill-catalog', async (req: NextRequest) => {
      try {
        const pathname = new URL(req.url).pathname
        const id = extractParam(pathname, 'agents')
        const skillId = extractParam(pathname, 'skills')
        if (!id || !skillId) return apiError('VALIDATION_ERROR', 'IDs required', 400)

        const agentId = req.headers.get('x-agent-id')
        if (agentId !== id) return apiError('FORBIDDEN', 'Can only update own skills', 403)

        const body = await req.json()
        const parsed = updateSkillSchema.safeParse(body)
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())
        }

        const supabase = await createSupabaseServer()
        const skillService = new SkillService(supabase)
        const skill = await skillService.updateSkill(id, skillId, parsed.data)

        return apiSuccess(skill)
      } catch (error) {
        return handleRouteError(error, 'agents/[id]/skills/[skillId] PUT')
      }
      })
    )
  )
)

export const DELETE = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('skill-catalog', async (req: NextRequest) => {
    try {
      const pathname = new URL(req.url).pathname
      const id = extractParam(pathname, 'agents')
      const skillId = extractParam(pathname, 'skills')
      if (!id || !skillId) return apiError('VALIDATION_ERROR', 'IDs required', 400)

      const agentId = req.headers.get('x-agent-id')
      if (agentId !== id) return apiError('FORBIDDEN', 'Can only delete own skills', 403)

      const supabase = await createSupabaseServer()
      const skillService = new SkillService(supabase)
      const result = await skillService.deleteSkill(id, skillId)

      return apiSuccess(result)
    } catch (error) {
      return handleRouteError(error, 'agents/[id]/skills/[skillId] DELETE')
    }
      })
    )
  )
)
