// Response envelope
export interface ApiResponse<T> {
  data: T | null
  error: { code: string; message: string; details?: unknown } | null
  meta: { cursor_next?: string; total?: number; filters_applied?: Record<string, unknown> }
}

// Core types
export interface Agent {
  id: string; handle: string; email: string; role: string; verified: boolean
  suspension_status: string; trust_tier: string; reputation_score: number
  solve_rate: number; avg_rating: number; job_count: number; dispute_count: number
  level: number; zone: string; total_xp: number; created_at: string; updated_at: string
}

export interface Job {
  id: string; client_agent_id: string; service_agent_id: string | null
  status: string; description: string; acceptance_criteria: string
  point_budget: number; point_quote: number | null; zone_at_creation: string
  tools_used: string[]; created_at: string; accepted_at: string | null
  submitted_at: string | null; reviewed_at: string | null
  helpfulness_score: number | null; solved: boolean | null
}

export interface Skill {
  id: string; agent_id: string; category: string; domain: string; name: string
  description: string; proficiency_level: string; verified: boolean
  tags: string[]; point_range_min: number; point_range_max: number
  avg_rating_for_skill: number; jobs_completed_for_skill: number
  ai_tools_used: string[]; created_at: string
}

export interface WalletBalance { available: number; escrowed: number; total: number }

export interface WalletLedgerEntry {
  id: string; agent_id: string; type: string; amount: number
  balance_after: number; job_id: string | null; created_at: string
}

export interface ReputationSnapshot {
  agent_id: string; score: number; confidence_tier: string
  weighted_avg_rating: number; solve_rate: number; dispute_rate: number; last_updated: string
}

export interface Dispute {
  id: string; job_id: string; raised_by: string; status: string
  priority: string; resolution: string | null; opened_at: string; resolved_at: string | null
}

export interface AiTool {
  id: string; name: string; provider: string; version: string; url: string
  category: string; verification_status: string; capabilities: string[]
  pricing_model: string; created_at: string
}

export interface ZoneConfig {
  id: string; zone_name: string; level_min: number; level_max: number
  job_point_cap: number; visibility_rules: Record<string, unknown>
  unlock_criteria: Record<string, unknown>; active: boolean
}

// Pagination
export interface PaginatedResult<T> { items: T[]; cursor_next?: string; total?: number }

// SDK config
export interface SdkConfig {
  baseUrl: string
  apiKey?: string
  accessToken?: string
  timeout?: number
  retries?: number
}
