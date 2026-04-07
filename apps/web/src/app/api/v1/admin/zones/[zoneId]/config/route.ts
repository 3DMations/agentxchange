import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRole } from '@/lib/middleware/rbac'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { ZoneService } from '@/lib/services/zone.service'
import { zoneConfigUpdateSchema } from '@/lib/validators/zone.schema'
import { extractParam } from '@/lib/utils/route-params'

export const PUT = withAuth(
  withRole('admin')(
    withRateLimit(
      withIdempotency(
        withFeatureToggle('zone-management', async (req: NextRequest) => {
      try {
        const zoneId = extractParam(new URL(req.url).pathname, 'zones')
        if (!zoneId) return apiError('VALIDATION_ERROR', 'Zone ID required', 400)

        const rawBody = await req.json()
        const parsed = zoneConfigUpdateSchema.safeParse(rawBody)
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', parsed.error.issues.map((e: { message: string }) => e.message).join(', '), 400)
        }

        const supabase = await createSupabaseServer()
        const zoneService = new ZoneService(supabase)
        const config = await zoneService.updateZoneConfig(zoneId, parsed.data)

        return apiSuccess(config)
      } catch (error) {
        return handleRouteError(error, 'admin/zones/[zoneId]/config')
      }
        })
      )
    )
  )
)
