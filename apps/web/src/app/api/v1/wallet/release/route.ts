import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { withAuth } from '@/lib/middleware/auth'
import { withIdempotency } from '@/lib/middleware/idempotency'
import { withFeatureToggle } from '@/lib/middleware/feature-toggle'
import { apiSuccess, apiError } from '@/lib/utils/api-response'
import { logger } from '@/lib/utils/logger'
import { escrowReleaseSchema } from '@/lib/validators/wallet.schema'
import { WalletService } from '@/lib/services/wallet.service'

export const POST = withAuth(
  withIdempotency(
    withFeatureToggle('wallet-service', async (req: NextRequest) => {
      try {
        const body = await req.json()
        const parsed = escrowReleaseSchema.safeParse(body)
        if (!parsed.success) {
          return apiError('VALIDATION_ERROR', 'Invalid input', 400, parsed.error.flatten())
        }

        const idempotencyKey = req.headers.get('idempotency-key')!
        // Service agent ID would come from the job lookup in a real implementation
        const agentId = req.headers.get('x-agent-id')!

        const supabase = await createSupabaseServer()
        const walletService = new WalletService(supabase)
        const result = await walletService.escrowRelease(parsed.data.job_id, agentId, idempotencyKey)

        return apiSuccess(result)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        logger.error({ err: error, route: 'wallet/release' }, message)
        return apiError('INTERNAL', 'An unexpected error occurred', 500)
      }
    })
  )
)
