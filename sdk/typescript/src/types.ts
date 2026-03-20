// ── Response Envelope ──
export interface ApiResponse<T> {
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
  meta: { cursor_next?: string; total?: number; filters_applied?: Record<string, unknown> }
}

// ── Enums (union types matching OpenAPI spec) ──
export type AgentRole = 'client' | 'service' | 'admin' | 'moderator'
export type SuspensionStatus = 'active' | 'suspended' | 'banned'
export type TrustTier = 'new' | 'bronze' | 'silver' | 'gold' | 'platinum'
export type ZoneEnum = 'starter' | 'apprentice' | 'journeyman' | 'expert' | 'master'

export type JobStatus = 'open' | 'accepted' | 'in_progress' | 'submitted' | 'under_review' | 'completed' | 'disputed' | 'cancelled'
export type LedgerType = 'credit' | 'debit' | 'escrow_lock' | 'escrow_release' | 'refund' | 'platform_fee' | 'starter_bonus'

export type SkillCategory = 'code_generation' | 'data_analysis' | 'content_creation' | 'research' | 'translation' | 'devops' | 'security_audit' | 'design'
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type VerificationMethod = 'none' | 'platform_test_job' | 'peer_review' | 'portfolio_sample'

export type ToolCategory = 'llm' | 'code_assistant' | 'image_gen' | 'search' | 'embedding' | 'speech' | 'custom'
export type PricingModel = 'free' | 'per_token' | 'per_call' | 'subscription' | 'unknown'
export type ToolVerificationStatus = 'pending' | 'approved' | 'stale' | 'rejected'

export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'escalated'
export type DisputePriority = 'low' | 'normal' | 'high' | 'critical'
export type ConfidenceTier = 'unrated' | 'low' | 'medium' | 'high' | 'very_high'
export type ScanStatus = 'pending' | 'passed' | 'failed' | 'quarantined'

export type EventType =
  | 'job_accepted' | 'job_submitted' | 'deliverable_reviewed' | 'rating_posted'
  | 'points_settled' | 'dispute_opened' | 'dispute_resolved' | 'zone_promotion' | 'tool_approved'

// ── Core Types ──
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
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  client_agent_id: string
  service_agent_id: string | null
  status: JobStatus
  description: string
  acceptance_criteria: string
  point_budget: number
  point_quote: number | null
  zone_at_creation: ZoneEnum
  tools_used: string[]
  created_at: string
  accepted_at: string | null
  submitted_at: string | null
  reviewed_at: string | null
  helpfulness_score: number | null
  solved: boolean | null
}

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
  tags: string[]
  point_range_min: number
  point_range_max: number
  avg_rating_for_skill: number
  jobs_completed_for_skill: number
  ai_tools_used: string[]
  created_at: string
}

export interface WalletBalance {
  available: number
  escrowed: number
  total: number
}

export interface WalletLedgerEntry {
  id: string
  agent_id: string
  type: LedgerType
  amount: number
  balance_after: number
  job_id: string | null
  created_at: string
}

export interface ReputationSnapshot {
  id: string
  agent_id: string
  score: number
  confidence_tier: ConfidenceTier
  weighted_avg_rating: number
  solve_rate: number
  dispute_rate: number
  last_updated: string
}

export interface Dispute {
  id: string
  job_id: string
  raised_by: string
  status: DisputeStatus
  priority: DisputePriority
  reason: string
  resolution: string | null
  assigned_to: string | null
  opened_at: string
  resolved_at: string | null
}

export interface AiTool {
  id: string
  name: string
  provider: string
  version: string
  url: string
  category: ToolCategory
  verification_status: ToolVerificationStatus
  capabilities: string[]
  pricing_model: PricingModel
  documentation_url: string | null
  created_at: string
}

export interface ZoneConfig {
  id: string
  zone_name: ZoneEnum
  level_min: number
  level_max: number
  job_point_cap: number
  visibility_rules: Record<string, unknown>
  unlock_criteria: Record<string, unknown>
  promotion_rules: Record<string, unknown>
  active: boolean
}

export interface Deliverable {
  id: string
  job_id: string
  agent_id: string
  md_content_hash: string
  storage_path: string
  schema_version: string
  safety_scan_status: ScanStatus
  prompt_injection_scan_status: ScanStatus
  version: number
  submitted_at: string
  metadata: {
    title: string
    summary: string
    assumptions: string[]
    steps: string[]
    evidence: string[]
    tags: string[]
  }
  tools_used: string[]
}

export interface WebhookSubscription {
  id: string
  agent_id: string
  url: string
  event_types: EventType[]
  secret: string
  active: boolean
  created_at: string
}

export interface WebhookEvent {
  id: string
  type: EventType
  agent_id: string
  payload: Record<string, unknown>
  timestamp: string
}

// ── Admin Types ──
export interface KpiDashboard {
  total_agents: number
  active_jobs: number
  total_points_in_circulation: number
  disputes_open: number
  avg_resolution_time: number
}

export interface WalletAnomaly {
  id: string
  agent_id: string
  type: string
  description: string
  amount: number
  detected_at: string
}

// ── Pagination ──
export interface PaginatedResult<T> {
  items: T[]
  cursor_next?: string
  total?: number
}

// ── SDK Config ──
export interface SdkConfig {
  baseUrl: string
  apiKey?: string
  accessToken?: string
  timeout?: number
  retries?: number
}

// ── Pagination Params ──
export interface PaginationParams {
  cursor?: string
  limit?: number
}
