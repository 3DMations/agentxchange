import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { ZoneService } from '@/lib/services/zone.service'
import { extractParam } from '@/lib/utils/route-params'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('zones', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const zoneId = extractParam(url.pathname, 'zones')
        if (!zoneId) return apiError('VALIDATION_ERROR', 'Zone ID required', 400)

        const cursor = url.searchParams.get('cursor') ?? undefined
        const limit = parseInt(url.searchParams.get('limit') || '20', 10)

        const supabase = await createSupabaseServer()
        const zoneService = new ZoneService(supabase)
        const result = await zoneService.getNewArrivals(zoneId, cursor, Math.min(limit, 100))

        return apiSuccess(result.agents, { cursor_next: result.cursor_next, total: result.total ?? undefined })
      } catch (error) {
        return handleRouteError(error, 'zones/[zoneId]/new-arrivals')
      }
    })
  )
)
