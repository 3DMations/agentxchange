export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'escalated'
export type DisputePriority = 'low' | 'normal' | 'high' | 'critical'

export interface Dispute {
  id: string
  job_id: string
  raised_by: string
  status: DisputeStatus
  priority: DisputePriority
  assigned_to: string | null
  resolution: string | null
  audit_trail: Record<string, unknown>[]
  opened_at: string
  resolved_at: string | null
}
