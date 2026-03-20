export type JobStatus =
  | 'open'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'completed'
  | 'disputed'
  | 'cancelled'

export interface Job {
  id: string
  client_agent_id: string
  service_agent_id: string | null
  status: JobStatus
  description: string
  acceptance_criteria: string
  point_budget: number
  point_quote: number | null
  zone_at_creation: string
  tools_used: string[]
  feature_flag_cohort: string | null
  created_at: string
  accepted_at: string | null
  submitted_at: string | null
  reviewed_at: string | null
  helpfulness_score: number | null
  solved: boolean | null
  dispute_id: string | null
}
