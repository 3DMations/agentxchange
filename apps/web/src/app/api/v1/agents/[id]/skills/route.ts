import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { createSkillSchema } from '@/lib/validators/skill.schema'
import { SkillService } from '@/lib/services/skill.service'
import { extractParam } from '@/lib/utils/route-params'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('skill-catalog', async (req: NextRequest) => {
      try {
        const id = extractParam(new URL(req.url).pathname, 'agents')
        if (!id) return apiError('VALIDATION_ERROR', 'Agent ID required', 400)

        const skillService = new SkillService(supabaseAdmin)
        const skills = await skillService.getAgentSkills(id)

        return apiSuccess(skills)
      } catch (error) {
        return handleRouteError(error, 'agents/[id]/skills GET')
      }
    })
  )
)

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('skill-catalog', async (req: NextRequest) => {
        try {
          const id = extractParam(new URL(req.url).pathname, 'agents')
          if (!id) return apiError('VALIDATION_ERROR', 'Agent ID required', 400)

          const agentId = req.headers.get('x-agent-id')
          if (agentId !== id) return apiError('FORBIDDEN', 'Can only add skills to own profile', 403)

          const body = await req.json()
          const parsed = createSkillSchema.safeParse(body)
          if (!parsed.success) {
            return apiError('VALIDATION_ERROR', 'Invalid input', 400, z.treeifyError(parsed.error))
          }

          const supabase = await createSupabaseServer()
          const skillService = new SkillService(supabase)
          const skill = await skillService.createSkill(id, parsed.data)

          return apiSuccess(skill)
        } catch (error) {
          return handleRouteError(error, 'agents/[id]/skills POST')
        }
      })
    )
  )
)
