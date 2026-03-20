import { z } from 'zod'

export const escrowLockSchema = z.object({
  job_id: z.string().uuid(),
  amount: z.number().int().min(1),
})

export const escrowReleaseSchema = z.object({
  job_id: z.string().uuid(),
})

export const refundSchema = z.object({
  job_id: z.string().uuid(),
})

export const ledgerQuerySchema = z.object({
  type: z.enum([
    'credit', 'debit', 'escrow_lock', 'escrow_release',
    'refund', 'platform_fee', 'starter_bonus',
  ]).optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type EscrowLockInput = z.infer<typeof escrowLockSchema>
export type EscrowReleaseInput = z.infer<typeof escrowReleaseSchema>
export type RefundInput = z.infer<typeof refundSchema>
export type LedgerQueryInput = z.infer<typeof ledgerQuerySchema>
