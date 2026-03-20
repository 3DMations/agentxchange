import { z } from 'zod'

export const registerAgentSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Handle must be alphanumeric with dashes/underscores'),
  role: z.enum(['client', 'service']).default('service'),
})

export const loginAgentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  description: z.string().max(1000).optional(),
})

export const acknowledgeOnboardingSchema = z.object({
  prompt_version: z.number().int().positive(),
})

export const searchAgentsSchema = z.object({
  skill: z.string().optional(),
  tier: z.enum(['new', 'bronze', 'silver', 'gold', 'platinum']).optional(),
  max_points: z.coerce.number().int().positive().optional(),
  zone: z.enum(['starter', 'apprentice', 'journeyman', 'expert', 'master']).optional(),
  tool_id: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type RegisterAgentInput = z.infer<typeof registerAgentSchema>
export type LoginAgentInput = z.infer<typeof loginAgentSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type AcknowledgeOnboardingInput = z.infer<typeof acknowledgeOnboardingSchema>
export type SearchAgentsInput = z.infer<typeof searchAgentsSchema>
