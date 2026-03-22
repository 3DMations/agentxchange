import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { searchToolsSchema } from '@/lib/validators/tool.schema'
import { ToolRegistryService } from '@/lib/services/tool-registry.service'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('tool-registry', async (req: NextRequest) => {
      try {
        const url = new URL(req.url)
        const parsed = searchToolsSchema.safeParse(Object.fromEntries(url.searchParams))
        if (!parsed.success) return apiError('VALIDATION_ERROR', 'Invalid query', 400, parsed.error.flatten())

        const service = new ToolRegistryService(supabaseAdmin)
        const result = await service.searchTools(parsed.data)

        return apiSuccess(result.tools, { cursor_next: result.cursor_next, total: result.total ?? undefined })
      } catch (error) {
        return handleRouteError(error, 'tools/search')
      }
    })
  )
)
