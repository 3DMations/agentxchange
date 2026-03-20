import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRole } from '@/lib/middleware/rbac'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { ZoneService } from '@/lib/services/zone.service'

export const PUT = withAuth(
  withRole('admin')(
    withIdempotency(async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const pathParts = url.pathname.split('/')
        const zonesIdx = pathParts.indexOf('zones')
        const zoneId = pathParts[zonesIdx + 1]
        if (!zoneId) return apiError('VALIDATION_ERROR', 'Zone ID required', 400)

        const body = await req.json()
        const supabase = await createSupabaseServer()
        const zoneService = new ZoneService(supabase)
        const config = await zoneService.updateZoneConfig(zoneId, body)

        return apiSuccess(config)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update zone config'
        return apiError('INTERNAL', message, 500)
      }
    })
  )
)
