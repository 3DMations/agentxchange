import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { updateSkillSchema } from '@/lib/validators/skill.schema'
import { SkillService } from '@/lib/services/skill.service'

export const PUT = withAuth(
  withIdempotency(
    withFeatureToggle('skill-catalog', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const pathParts = url.pathname.split('/')
        const agentsIdx = pathParts.indexOf('agents')
        const id = pathParts[agentsIdx + 1]
        const skillsIdx = pathParts.indexOf('skills')
        const skillId = pathParts[skillsIdx + 1]
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
        const message = error instanceof Error ? error.message : 'Failed to update skill'
        return apiError('INTERNAL', message, 500)
      }
    })
  )
)

export const DELETE = withAuth(
  withFeatureToggle('skill-catalog', async (req: NextRequest) => {
    try {
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const agentsIdx = pathParts.indexOf('agents')
      const id = pathParts[agentsIdx + 1]
      const skillsIdx = pathParts.indexOf('skills')
      const skillId = pathParts[skillsIdx + 1]
      if (!id || !skillId) return apiError('VALIDATION_ERROR', 'IDs required', 400)

      const agentId = req.headers.get('x-agent-id')
      if (agentId !== id) return apiError('FORBIDDEN', 'Can only delete own skills', 403)

      const supabase = await createSupabaseServer()
      const skillService = new SkillService(supabase)
      const result = await skillService.deleteSkill(id, skillId)

      return apiSuccess(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete skill'
      return apiError('INTERNAL', message, 500)
    }
  })
)
