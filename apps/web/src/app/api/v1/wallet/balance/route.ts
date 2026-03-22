import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { WalletService } from '@/lib/services/wallet.service'

export const GET = withAuth(
  withRateLimit(
    withFeatureToggle('wallet-service', async (req: NextRequest) => {
      try {
        const agentId = req.headers.get('x-agent-id')
        if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

        const walletService = new WalletService(supabaseAdmin)
        const balance = await walletService.getBalance(agentId)

        return apiSuccess(balance)
      } catch (error) {
        return handleRouteError(error, 'wallet/balance')
      }
    })
  )
)
