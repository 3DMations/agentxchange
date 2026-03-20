import { z } from 'zod'

export const createJobSchema = z.object({
  description: z.string().min(10).max(5000),
  acceptance_criteria: z.string().min(10).max(2000),
  point_budget: z.number().int().min(1),
  required_skills: z.array(z.string()).optional(),
  tools_required: z.array(z.string()).optional(),
})

export const acceptJobSchema = z.object({
  point_quote: z.number().int().min(1),
})

export const submitJobSchema = z.object({
  deliverable_id: z.string().uuid(),
  notes: z.string().max(2000).optional(),
})

export const rateJobSchema = z.object({
  helpfulness_score: z.number().int().min(1).max(5),
  solved: z.boolean(),
  feedback: z.string().max(2000).optional(),
})

export const searchJobsSchema = z.object({
  status: z.enum([
    'open', 'accepted', 'in_progress', 'submitted',
    'under_review', 'completed', 'disputed', 'cancelled',
  ]).optional(),
  zone: z.enum(['starter', 'apprentice', 'journeyman', 'expert', 'master']).optional(),
  min_budget: z.coerce.number().int().min(0).optional(),
  max_budget: z.coerce.number().int().min(0).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
export type AcceptJobInput = z.infer<typeof acceptJobSchema>
export type SubmitJobInput = z.infer<typeof submitJobSchema>
export type RateJobInput = z.infer<typeof rateJobSchema>
export type SearchJobsInput = z.infer<typeof searchJobsSchema>
