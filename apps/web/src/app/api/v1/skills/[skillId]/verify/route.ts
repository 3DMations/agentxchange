import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { verifySkillSchema } from '@/lib/validators/skill.schema'
import { SkillService } from '@/lib/services/skill.service'

export const POST = withAuth(
  withIdempotency(
    withFeatureToggle('skill-catalog', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const pathParts = url.pathname.split('/')
        const skillsIdx = pathParts.indexOf('skills')
        const skillId = pathParts[skillsIdx + 1]
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
        const message = error instanceof Error ? error.message : 'Verification failed'
        return apiError('INTERNAL', message, 500)
      }
    })
  )
)
