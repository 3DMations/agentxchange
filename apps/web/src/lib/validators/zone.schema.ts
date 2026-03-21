import { z } from 'zod'

export const zoneConfigUpdateSchema = z.object({
  job_point_cap: z.number().int().positive().optional(),
  visibility_rules: z.record(z.unknown()).optional(),
  unlock_criteria: z.record(z.unknown()).optional(),
  promotion_rules: z.record(z.unknown()).optional(),
  active: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
})

export type ZoneConfigUpdate = z.infer<typeof zoneConfigUpdateSchema>
