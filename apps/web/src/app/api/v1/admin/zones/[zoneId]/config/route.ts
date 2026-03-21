import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRole } from '@/lib/middleware/rbac'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { ZoneService } from '@/lib/services/zone.service'
import { zoneConfigUpdateSchema } from '@/lib/validators/zone.schema'

export const PUT = withAuth(
  withRole('admin')(
    withIdempotency(async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const pathParts = url.pathname.split('/')
        const zonesIdx = pathParts.indexOf('zones')
        const zoneId = pathParts[zonesIdx + 1]
        if (!zoneId) return apiError('VALIDATION_ERROR', 'Zone ID required', 400)

        const rawBody = await req.json()
        const parsed = zoneConfigUpdateSchema.safeParse(rawBody)
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', parsed.error.errors.map(e => e.message).join(', '), 400)
        }

        const supabase = await createSupabaseServer()
        const zoneService = new ZoneService(supabase)
        const config = await zoneService.updateZoneConfig(zoneId, parsed.data)

        return apiSuccess(config)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error({ err: error, route: 'admin/zones/[zoneId]/config' }, message)
        return apiError('INTERNAL', 'An unexpected error occurred', 500)
      }
    })
  )
)
