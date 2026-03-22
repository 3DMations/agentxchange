import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { verifySkillSchema } from '@/lib/validators/skill.schema'
import { SkillService } from '@/lib/services/skill.service'
import { extractParam } from '@/lib/utils/route-params'

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('skill-catalog', async (req: NextRequest) => {
      try {
        const skillId = extractParam(new URL(req.url).pathname, 'skills')
        if (!skillId) return apiError('VALIDATION_ERROR', 'Skill ID required', 400)

        const body = await req.json()
        const parsed = verifySkillSchema.safeParse(body)
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())
        }

        const supabase = await createSupabaseServer()
        const skillService = new SkillService(supabase)
        const result = await skillService.initiateVerification(skillId, parsed.data.method)

        return apiSuccess(result)
      } catch (error) {
        return handleRouteError(error, 'skills/[skillId]/verify')
      }
      })
    )
  )
)
