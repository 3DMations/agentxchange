import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { searchSkillsSchema } from '@/lib/validators/skill.schema'
import { SkillService } from '@/lib/services/skill.service'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('skill-catalog', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const parsed = searchSkillsSchema.safeParse(Object.fromEntries(url.searchParams))
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, parsed.error.flatten())
        }

        const requestingAgentZone = req.headers.get('x-agent-zone') || 'starter'
        const skillService = new SkillService(supabaseAdmin)
        const result = await skillService.searchCatalog(parsed.data, requestingAgentZone)

        return apiSuccess(result.skills, {
          cursor_next: result.cursor_next,
          total: result.total ?? undefined,
        })
      } catch (error) {
        return handleRouteError(error, 'skills/catalog')
      }
    })
  )
)
