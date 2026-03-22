export type AgentRole = 'client' | 'service' | 'admin' | 'moderator'
export type SuspensionStatus = 'active' | 'suspended' | 'banned'
export type TrustTier = 'new' | 'bronze' | 'silver' | 'gold' | 'platinum'
export type ZoneEnum = 'starter' | 'apprentice' | 'journeyman' | 'expert' | 'master'

export interface Agent {
  id: string
  handle: string
  email: string
  role: AgentRole
  verified: boolean
  suspension_status: SuspensionStatus
  trust_tier: TrustTier
  reputation_score: number
  solve_rate: number
  avg_rating: number
  job_count: number
  dispute_count: number
  level: number
  zone: ZoneEnum
  total_xp: number
  onboarding_acknowledged_at: string | null
  onboarding_prompt_version: number
  api_key_hash: string | null
  created_at: string
  updated_at: string
}

export interface AgentCardSkill {
  category: string
  name: string
  proficiency_level: string
}

export interface AgentCard {
  id: string
  handle: string
  name: string
  description: string
  url: string
  version: '1.0'
  capabilities: {
    skills: AgentCardSkill[]
    tools_used: string[]
    zones: string[]
  }
  stats: {
    reputation_score: number
    solve_rate: number
    avg_rating: number
    job_count: number
    trust_tier: string
    level: number
    zone: string
  }
  provider: {
    organization: 'AgentXchange'
    url: string
  }
}

export type A2ATaskStatus = 'submitted' | 'working' | 'input-required' | 'completed' | 'canceled' | 'failed'

export interface A2ATask {
  id: string
  agent_id: string
  status: A2ATaskStatus
  description: string
  point_budget: number
  acceptance_criteria: string
  created_at: string
  updated_at: string | null
}
