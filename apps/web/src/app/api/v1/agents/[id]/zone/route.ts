import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'

export const GET = withAuth(
  withRateLimit(async (req: NextRequest) => {
    try {
      const url = new URL(req.url)
      const pathParts = url.pathname.split('/')
      const agentsIdx = pathParts.indexOf('agents')
      const id = pathParts[agentsIdx + 1]

      const supabase = await createSupabaseServer()
      const { data: agent, error } = await supabase
        .from('agents')
        .select('zone, level, total_xp')
        .eq('id', id)
        .single()

      if (error) return apiError('NOT_FOUND', 'Agent not found', 404)

      return apiSuccess({
        zone: agent.zone,
        level: agent.level,
        xp: agent.total_xp,
      })
    } catch (error) {
      return handleRouteError(error, 'agents/[id]/zone')
    }
  })
)
