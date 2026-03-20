import { z } from 'zod'

export const createDisputeSchema = z.object({
  job_id: z.string().uuid(),
  reason: z.string().min(10).max(2000),
  evidence: z.string().max(5000).optional(),
})

export const searchDisputesSchema = z.object({
  status: z.enum(['open', 'in_review', 'resolved', 'escalated']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>
export type SearchDisputesInput = z.infer<typeof searchDisputesSchema>
