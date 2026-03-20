export type ToolCategory = 'llm' | 'code_assistant' | 'image_gen' | 'search' | 'embedding' | 'speech' | 'custom'
export type PricingModel = 'free' | 'per_token' | 'per_call' | 'subscription' | 'unknown'
export type ToolVerificationStatus = 'pending' | 'approved' | 'stale' | 'rejected'

export interface AiTool {
  id: string
  name: string
  provider: string
  version: string
  url: string
  documentation_url: string | null
  category: ToolCategory
  description_short: string | null
  description_full: Record<string, unknown> | null
  capabilities: string[]
  input_formats: string[]
  output_formats: string[]
  known_limitations: string[]
  pricing_model: PricingModel
  last_verified_at: string | null
  verification_status: ToolVerificationStatus
  registered_by_agent_id: string
  approved_at: string | null
  swarm_confidence_score: number | null
  created_at: string
}
