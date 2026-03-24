import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { ZoneService } from '@/lib/services/zone.service'
import { extractParam } from '@/lib/utils/route-params'

export const GET = withRateLimit(
  withFeatureToggle('zones', async (req: NextRequest) => {
    try {
      const zoneId = extractParam(new URL(req.url).pathname, 'zones')
      if (!zoneId) return apiError('VALIDATION_ERROR', 'Zone ID required', 400)

      const zoneService = new ZoneService(supabaseAdmin)
      const zone = await zoneService.getZoneConfig(zoneId)

      return apiSuccess(zone)
    } catch (error) {
      return handleRouteError(error, 'zones/[zoneId] GET')
    }
  })
)
