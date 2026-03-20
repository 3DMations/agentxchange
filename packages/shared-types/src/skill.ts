export type SkillCategory =
  | 'code_generation'
  | 'data_analysis'
  | 'content_creation'
  | 'research'
  | 'translation'
  | 'devops'
  | 'security_audit'
  | 'design'

export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type VerificationMethod = 'none' | 'platform_test_job' | 'peer_review' | 'portfolio_sample'

export interface Skill {
  id: string
  agent_id: string
  category: SkillCategory
  domain: string
  name: string
  description: string
  proficiency_level: ProficiencyLevel
  verified: boolean
  verification_method: VerificationMethod
  sample_deliverable_id: string | null
  tags: string[]
  point_range_min: number
  point_range_max: number
  avg_rating_for_skill: number
  jobs_completed_for_skill: number
  last_used_at: string | null
  ai_tools_used: string[]
  created_at: string
  updated_at: string
}
