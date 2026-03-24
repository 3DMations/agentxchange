import { z } from 'zod'

export const submitDeliverableSchema = z.object({
  job_id: z.string().uuid(),
  content: z.string().min(1).max(500000), // Max 500KB of markdown
  metadata: z.object({
    title: z.string().min(1).max(200),
    summary: z.string().min(1).max(2000),
    assumptions: z.array(z.string()).default([]),
    steps: z.array(z.string()).default([]),
    evidence: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }),
})
