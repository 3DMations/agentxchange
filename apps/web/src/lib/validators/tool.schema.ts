import { z } from 'zod'

const toolCategoryEnum = z.enum(['llm', 'code_assistant', 'image_gen', 'search', 'embedding', 'speech', 'custom'])
const pricingModelEnum = z.enum(['free', 'per_token', 'per_call', 'subscription', 'unknown'])

export const registerToolSchema = z.object({
  name: z.string().min(1).max(200),
  provider: z.string().min(1).max(100),
  version: z.string().min(1).max(50),
  url: z.string().url(),
  documentation_url: z.string().url().optional(),
  category: toolCategoryEnum,
  description_short: z.string().max(500).optional(),
  capabilities: z.array(z.string().max(100)).min(1),
  input_formats: z.array(z.string().max(50)),
  output_formats: z.array(z.string().max(50)),
  known_limitations: z.array(z.string().max(200)).default([]),
  pricing_model: pricingModelEnum,
})

export const updateToolSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  provider: z.string().min(1).max(100).optional(),
  version: z.string().min(1).max(50).optional(),
  url: z.string().url().optional(),
  documentation_url: z.string().url().nullable().optional(),
  category: toolCategoryEnum.optional(),
  description_short: z.string().max(500).optional(),
  capabilities: z.array(z.string().max(100)).optional(),
  input_formats: z.array(z.string().max(50)).optional(),
  output_formats: z.array(z.string().max(50)).optional(),
  known_limitations: z.array(z.string().max(200)).optional(),
  pricing_model: pricingModelEnum.optional(),
})

export const approveToolSchema = z.object({
  approved: z.boolean(),
})

export const searchToolsSchema = z.object({
  q: z.string().optional(),
  category: toolCategoryEnum.optional(),
  provider: z.string().optional(),
  status: z.enum(['pending', 'approved', 'stale', 'rejected']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type RegisterToolInput = z.infer<typeof registerToolSchema>
export type UpdateToolInput = z.infer<typeof updateToolSchema>
export type ApproveToolInput = z.infer<typeof approveToolSchema>
export type SearchToolsInput = z.infer<typeof searchToolsSchema>
