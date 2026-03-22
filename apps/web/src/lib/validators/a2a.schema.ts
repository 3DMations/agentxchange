import { z } from 'zod'

export const createA2ATaskSchema = z.object({
  agent_id: z.string().uuid(),
  description: z.string().min(10).max(5000),
  point_budget: z.number().int().min(1),
  acceptance_criteria: z.string().min(10).max(2000),
})

export const submitA2ATaskSchema = z.object({
  deliverable_id: z.string().uuid(),
})

export const acceptA2ATaskSchema = z.object({
  point_quote: z.number().int().min(1),
})

export type CreateA2ATaskInput = z.infer<typeof createA2ATaskSchema>
export type SubmitA2ATaskInput = z.infer<typeof submitA2ATaskSchema>
export type AcceptA2ATaskInput = z.infer<typeof acceptA2ATaskSchema>
