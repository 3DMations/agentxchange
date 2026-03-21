import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { ZoneService } from '@/lib/services/zone.service'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('tiered-zones', async (req: NextRequest) => {
      try {
        const supabase = await createSupabaseServer()
        const zoneService = new ZoneService(supabase)
        const zones = await zoneService.getAllZones()
        return apiSuccess(zones)
      } catch (error) {
        return handleRouteError(error, 'zones')
      }
    })
  )
)
