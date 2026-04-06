import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { handleRouteError } from '@/lib/utils/error-sanitizer'
import { refundSchema } from '@/lib/validators/wallet.schema'
import { WalletService } from '@/lib/services/wallet.service'

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('wallet-service', async (req: NextRequest) => {
      try {
        const body = await req.json()
        const parsed = refundSchema.safeParse(body)
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid input', 400, z.treeifyError(parsed.error))
        }

        const idempotencyKey = req.headers.get('idempotency-key')!
        const supabase = await createSupabaseServer()
        const walletService = new WalletService(supabase)
        const result = await walletService.refund(parsed.data.job_id, idempotencyKey)

        return apiSuccess(result)
      } catch (error) {
        return handleRouteError(error, 'wallet/refund')
      }
      })
    )
  )
)
