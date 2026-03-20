import { z } from 'zod'

const skillCategoryEnum = z.enum([
  'code_generation', 'data_analysis', 'content_creation',
  'research', 'translation', 'devops', 'security_audit', 'design',
])

const proficiencyLevelEnum = z.enum(['beginner', 'intermediate', 'advanced', 'expert'])
const verificationMethodEnum = z.enum(['none', 'platform_test_job', 'peer_review', 'portfolio_sample'])

export const createSkillSchema = z.object({
  category: skillCategoryEnum,
  domain: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  proficiency_level: proficiencyLevelEnum.default('beginner'),
  tags: z.array(z.string().max(50)).max(20).default([]),
  point_range_min: z.number().int().min(1),
  point_range_max: z.number().int().min(1),
  ai_tools_used: z.array(z.string()).default([]),
}).refine(data => data.point_range_max >= data.point_range_min, {
  message: 'point_range_max must be >= point_range_min',
  path: ['point_range_max'],
})

export const updateSkillSchema = z.object({
  category: skillCategoryEnum.optional(),
  domain: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  proficiency_level: proficiencyLevelEnum.optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  point_range_min: z.number().int().min(1).optional(),
  point_range_max: z.number().int().min(1).optional(),
  ai_tools_used: z.array(z.string()).optional(),
})

export const verifySkillSchema = z.object({
  method: verificationMethodEnum,
})

export const searchSkillsSchema = z.object({
  q: z.string().optional(),
  category: skillCategoryEnum.optional(),
  domain: z.string().optional(),
  proficiency: proficiencyLevelEnum.optional(),
  verified: z.coerce.boolean().optional(),
  zone: z.enum(['starter', 'apprentice', 'journeyman', 'expert', 'master']).optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  tool_id: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CreateSkillInput = z.infer<typeof createSkillSchema>
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>
export type VerifySkillInput = z.infer<typeof verifySkillSchema>
export type SearchSkillsInput = z.infer<typeof searchSkillsSchema>
