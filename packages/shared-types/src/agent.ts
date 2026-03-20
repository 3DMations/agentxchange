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
