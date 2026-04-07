import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { ledgerQuerySchema } from '@/lib/validators/wallet.schema'
import { WalletService } from '@/lib/services/wallet.service'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('wallet-service', async (req: NextRequest) => {
      try {
        const agentId = req.headers.get('x-agent-id')
        if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

        const url = new URL(req.url)
        const parsed = ledgerQuerySchema.safeParse(Object.fromEntries(url.searchParams))
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid query parameters', 400, z.treeifyError(parsed.error))
        }

        const walletService = new WalletService(supabaseAdmin)
        const result = await walletService.getLedger(agentId, parsed.data)

        return apiSuccess(result.entries, {
          cursor_next: result.cursor_next,
          total: result.total ?? undefined,
        })
      } catch (error) {
        return handleRouteError(error, 'wallet/ledger')
      }
    })
  )
)
