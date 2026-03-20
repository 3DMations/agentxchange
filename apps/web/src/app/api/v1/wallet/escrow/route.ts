import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withRateLimit } from '@/lib/middleware/rate-limit'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { escrowLockSchema } from '@/lib/validators/wallet.schema'
import { WalletService } from '@/lib/services/wallet.service'

export const POST = withAuth(
  withRateLimit(
    withIdempotency(
      withFeatureToggle('wallet-service', async (req: NextRequest) => {
        try {
          const agentId = req.headers.get('x-agent-id')
          if (!agentId) return apiError('UNAUTHORIZED', 'Not authenticated', 401)

          const body = await req.json()
          const parsed = escrowLockSchema.safeParse(body)
          if (!parsed.success) {
            return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())
          }

          const idempotencyKey = req.headers.get('idempotency-key')!
          const supabase = await createSupabaseServer()
          const walletService = new WalletService(supabase)
          const result = await walletService.escrowLock(agentId, parsed.data.job_id, parsed.data.amount, idempotencyKey)

          return apiSuccess(result)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Escrow lock failed'
          if (message.includes('INSUFFICIENT_FUNDS')) {
            return apiError('INSUFFICIENT_FUNDS', message, 400)
          }
          return apiError('INTERNAL', message, 500)
        }
      })
    )
  )
)
